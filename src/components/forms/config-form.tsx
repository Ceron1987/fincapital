'use client';
import { guardarConfig } from '@/lib/actions/mutations';
import type { Configuracion } from '@/types/database';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

const toP = (c: number | null | undefined) => (c == null ? '' : String(c / 100));
const toC = (p: string) => (p === '' ? null : Math.round(Number(p) * 100));

export function ConfigForm({ c }: { c: Configuracion | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [f, setF] = useState({
    min: toP(c?.monto_minimo_nuevo_centavos ?? 700000),
    max: toP(c?.monto_maximo_nuevo_centavos ?? 1000000),
    inc: toP(c?.incremento_renovacion_centavos ?? 300000),
    tarifa: toP(c?.tarifa_renovacion_centavos ?? null),
    limite: toP(c?.limite_renovacion_centavos ?? null),
    meta: toP(c?.meta_semanal_default_centavos ?? 3000000),
    plazoMin: String(c?.plazo_min_meses ?? 12),
    plazoMax: String(c?.plazo_max_meses ?? 36),
    antig: String(c?.antiguedad_minima_meses ?? 6),
    whats: c?.contacto_whatsapp ?? '442 486 4772',
    horario: c?.horario_atencion ?? '8:00 am – 8:00 pm',
  });
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const res = await guardarConfig({
        monto_minimo_nuevo_centavos: toC(f.min),
        monto_maximo_nuevo_centavos: toC(f.max),
        incremento_renovacion_centavos: toC(f.inc) ?? 0,
        tarifa_renovacion_centavos: toC(f.tarifa),
        limite_renovacion_centavos: toC(f.limite),
        meta_semanal_default_centavos: toC(f.meta) ?? 0,
        plazo_min_meses: Number(f.plazoMin),
        plazo_max_meses: Number(f.plazoMax),
        antiguedad_minima_meses: Number(f.antig),
        contacto_whatsapp: f.whats,
        horario_atencion: f.horario,
      });
      if (!res.ok) {
        setMsg({ ok: false, text: res.error });
        return;
      }
      setMsg({ ok: true, text: 'Reglas guardadas.' });
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="card p-5">
      <h3 className="font-semibold mb-4">Reglas de crédito</h3>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <F label="Monto mínimo nuevo (MXN)" value={f.min} onChange={(v) => set('min', v)} />
          <F label="Monto máximo nuevo (MXN)" value={f.max} onChange={(v) => set('max', v)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <F label="Plazo mín. (meses)" value={f.plazoMin} onChange={(v) => set('plazoMin', v)} />
          <F label="Plazo máx. (meses)" value={f.plazoMax} onChange={(v) => set('plazoMax', v)} />
          <F label="Antigüedad mín. (meses)" value={f.antig} onChange={(v) => set('antig', v)} />
        </div>
        <F label="Incremento propuesto en renovación (MXN)" value={f.inc} onChange={(v) => set('inc', v)} />
        <div className="grid grid-cols-2 gap-3">
          <F
            label="Tarifa de renovación (MXN)"
            value={f.tarifa}
            onChange={(v) => set('tarifa', v)}
            placeholder="— pendiente —"
          />
          <F
            label="Límite máx. renovación (MXN)"
            value={f.limite}
            onChange={(v) => set('limite', v)}
            placeholder="— pendiente —"
          />
        </div>
        <F label="Meta semanal por asesor (MXN)" value={f.meta} onChange={(v) => set('meta', v)} />
        <div className="grid grid-cols-2 gap-3">
          <F label="WhatsApp de contacto" value={f.whats} onChange={(v) => set('whats', v)} type="text" />
          <F label="Horario de atención" value={f.horario} onChange={(v) => set('horario', v)} type="text" />
        </div>
      </div>

      {msg ? (
        <div
          className={`mt-4 text-xs rounded-lg p-3 ${
            msg.ok
              ? 'text-emerald-200 bg-emerald-500/10 border border-emerald-500/30'
              : 'text-rose-300 bg-rose-500/10 border border-rose-500/30'
          }`}
        >
          {msg.text}
        </div>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-primary mt-4">
        {pending ? 'Guardando…' : 'Guardar reglas'}
      </button>
      <p className="text-[11px] text-slate-500 mt-2">
        Deja Tarifa y Límite vacíos hasta que FinCapital los confirme; el sistema no los aplica solo.
      </p>
    </form>
  );
}

function F({
  label,
  value,
  onChange,
  placeholder,
  type = 'number',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label>{label}</label>
      <input
        type={type}
        className="w-full mt-1"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
