'use client';
import { crearCliente } from '@/lib/actions/mutations';
import { centavos } from '@/lib/utils/format';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

type Asesor = { id: string; nombre: string };

export function NuevoClienteForm({
  asesores,
  esGerente,
  antiguedadMinMeses,
  girosObjetivo,
}: {
  asesores: Asesor[];
  esGerente: boolean;
  antiguedadMinMeses: number;
  girosObjetivo: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    giro: '',
    direccion: '',
    colonia: '',
    antiguedad_negocio: '',
    asesor_id: '',
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await crearCliente({
        ...form,
        asesor_id: form.asesor_id || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/expedientes/${res.id}`);
    });
  }

  return (
    <form onSubmit={submit} className="card p-6 max-w-2xl space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label>Nombre del titular *</label>
          <input
            required
            className="w-full mt-1"
            value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            placeholder="Ej. María López"
          />
        </div>
        <div>
          <label>Teléfono / WhatsApp</label>
          <input
            className="w-full mt-1"
            value={form.telefono}
            onChange={(e) => set('telefono', e.target.value)}
            placeholder="442 123 4567"
          />
        </div>
        <div>
          <label>Giro del negocio</label>
          <input
            className="w-full mt-1"
            list="giros"
            value={form.giro}
            onChange={(e) => set('giro', e.target.value)}
            placeholder="Tortillería, Abarrotes…"
          />
          <datalist id="giros">
            {girosObjetivo.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>
        <div className="md:col-span-2">
          <label>Dirección del negocio</label>
          <input
            className="w-full mt-1"
            value={form.direccion}
            onChange={(e) => set('direccion', e.target.value)}
            placeholder="Calle, número"
          />
        </div>
        <div>
          <label>Colonia</label>
          <input
            className="w-full mt-1"
            value={form.colonia}
            onChange={(e) => set('colonia', e.target.value)}
          />
        </div>
        <div>
          <label>Antigüedad del negocio</label>
          <input
            className="w-full mt-1"
            value={form.antiguedad_negocio}
            onChange={(e) => set('antiguedad_negocio', e.target.value)}
            placeholder="Ej. 2 años"
          />
          <p className="text-[11px] text-amber-300 mt-1">
            Mínimo {antiguedadMinMeses} meses para calificar.
          </p>
        </div>
        {esGerente ? (
          <div className="md:col-span-2">
            <label>Asignar a asesor</label>
            <select
              className="w-full mt-1"
              value={form.asesor_id}
              onChange={(e) => set('asesor_id', e.target.value)}
            >
              <option value="">— Sin asignar —</option>
              {asesores.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
          {error}
        </div>
      ) : null}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? 'Guardando…' : 'Guardar cliente'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}
