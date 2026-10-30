'use client';
import { crearSolicitud } from '@/lib/actions/mutations';
import { centavos } from '@/lib/utils/format';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

type ClienteOpt = { id: string; folio: string; nombre: string };

export function NuevaSolicitudForm({
  clientes,
  montoMin,
  montoMax,
  plazoMin,
  plazoMax,
  clientePre,
}: {
  clientes: ClienteOpt[];
  montoMin: number; // centavos
  montoMax: number; // centavos
  plazoMin: number;
  plazoMax: number;
  clientePre?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    cliente_id: clientePre ?? '',
    tipo: 'nuevo' as 'nuevo' | 'renovacion',
    monto: Math.round(montoMin / 100),
    plazo: plazoMin,
    destino_uso: '',
    comentarios: '',
  });

  const montoCentavos = useMemo(() => Math.round(form.monto * 100), [form.monto]);
  const montoFueraRango =
    form.tipo === 'nuevo' && (montoCentavos < montoMin || montoCentavos > montoMax);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.cliente_id) {
      setError('Selecciona un cliente.');
      return;
    }
    start(async () => {
      const res = await crearSolicitud({
        cliente_id: form.cliente_id,
        tipo: form.tipo,
        monto_solicitado_centavos: montoCentavos,
        plazo_meses: form.plazo,
        destino_uso: form.destino_uso,
        comentarios: form.comentarios,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push('/autorizacion');
    });
  }

  return (
    <form onSubmit={submit} className="card p-6 max-w-2xl space-y-4">
      <div>
        <label>Cliente *</label>
        <select
          required
          className="w-full mt-1"
          value={form.cliente_id}
          onChange={(e) => setForm((f) => ({ ...f, cliente_id: e.target.value }))}
        >
          <option value="">— Selecciona —</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.folio} · {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label>Tipo</label>
          <select
            className="w-full mt-1"
            value={form.tipo}
            onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as any }))}
          >
            <option value="nuevo">Cliente nuevo</option>
            <option value="renovacion">Renovación</option>
          </select>
        </div>
        <div>
          <label>Monto solicitado (MXN)</label>
          <input
            type="number"
            className="w-full mt-1"
            value={form.monto}
            onChange={(e) => setForm((f) => ({ ...f, monto: Number(e.target.value) }))}
          />
          {form.tipo === 'nuevo' ? (
            <p className={`text-[11px] mt-1 ${montoFueraRango ? 'text-rose-300' : 'text-slate-500'}`}>
              Rango nuevo: {centavos.toMXN(montoMin)} – {centavos.toMXN(montoMax)}
            </p>
          ) : null}
        </div>
        <div>
          <label>Plazo (meses)</label>
          <input
            type="number"
            min={plazoMin}
            max={plazoMax}
            className="w-full mt-1"
            value={form.plazo}
            onChange={(e) => setForm((f) => ({ ...f, plazo: Number(e.target.value) }))}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Permitido: {plazoMin}–{plazoMax} meses
          </p>
        </div>
      </div>

      <div>
        <label>Destino / uso del financiamiento</label>
        <input
          className="w-full mt-1"
          value={form.destino_uso}
          onChange={(e) => setForm((f) => ({ ...f, destino_uso: e.target.value }))}
          placeholder="Ej. compra de inventario"
        />
      </div>
      <div>
        <label>Comentarios</label>
        <textarea
          className="w-full mt-1"
          rows={2}
          value={form.comentarios}
          onChange={(e) => setForm((f) => ({ ...f, comentarios: e.target.value }))}
        />
      </div>

      {error ? (
        <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? 'Enviando…' : 'Enviar a autorización'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn btn-ghost">
          Cancelar
        </button>
        <span className="text-[11px] text-slate-500 ml-2">
          Queda en AMARILLO hasta que el gerente la resuelva.
        </span>
      </div>
    </form>
  );
}
