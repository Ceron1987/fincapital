'use client';
import { registrarPago } from '@/lib/actions/mutations';
import { centavos } from '@/lib/utils/format';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

type CreditoOpt = { id: string; folio: string; nombre: string; saldo_centavos: number };

export function RegistrarPagoForm({ creditos }: { creditos: CreditoOpt[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    credito_id: '',
    monto: 0,
    fecha_pago: new Date().toISOString().slice(0, 10),
    comentarios: '',
  });

  const sel = creditos.find((c) => c.id === form.credito_id);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.credito_id) {
      setError('Selecciona el crédito.');
      return;
    }
    if (form.monto <= 0) {
      setError('Captura el monto del pago.');
      return;
    }
    start(async () => {
      const res = await registrarPago({
        credito_id: form.credito_id,
        monto_centavos: Math.round(form.monto * 100),
        fecha_pago: form.fecha_pago,
        comentarios: form.comentarios,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push('/cobranza');
    });
  }

  return (
    <form onSubmit={submit} className="card p-6 max-w-xl space-y-4">
      <div>
        <label>Crédito *</label>
        <select
          required
          className="w-full mt-1"
          value={form.credito_id}
          onChange={(e) => setForm((f) => ({ ...f, credito_id: e.target.value }))}
        >
          <option value="">— Selecciona —</option>
          {creditos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.folio} · {c.nombre} · saldo {centavos.toMXN(c.saldo_centavos)}
            </option>
          ))}
        </select>
        {sel ? (
          <p className="text-[11px] text-slate-500 mt-1">
            Saldo actual: {centavos.toMXN(sel.saldo_centavos)}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label>Monto del pago (MXN)</label>
          <input
            type="number"
            className="w-full mt-1"
            value={form.monto}
            onChange={(e) => setForm((f) => ({ ...f, monto: Number(e.target.value) }))}
          />
        </div>
        <div>
          <label>Fecha</label>
          <input
            type="date"
            className="w-full mt-1"
            value={form.fecha_pago}
            onChange={(e) => setForm((f) => ({ ...f, fecha_pago: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <label>Comentarios</label>
        <input
          className="w-full mt-1"
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
          {pending ? 'Registrando…' : 'Registrar pago'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn btn-ghost">
          Cancelar
        </button>
        <span className="text-[11px] text-slate-500 ml-1">
          Queda pendiente de conciliar por el gerente.
        </span>
      </div>
    </form>
  );
}
