import { ConfigForm } from '@/components/forms/config-form';
import { Chip } from '@/components/ui/chip';
import { getCurrentUser } from '@/lib/auth/current-user';
import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage() {
  const u = await getCurrentUser();
  if (!u) redirect('/login');
  if (u.perfil.rol !== 'gerente') redirect('/dashboard');

  const supabase = createServerSupabase();
  const { data: c } = await supabase.from('configuracion').select('*').eq('id', 'singleton').single();

  const mapsHabilitado =
    !!process.env.MAPBOX_ACCESS_TOKEN || !!process.env.GOOGLE_MAPS_API_KEY;
  const supabaseConfigurado = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <ConfigForm c={c} />

      <div className="card p-5">
        <h3 className="font-semibold mb-4">Integraciones</h3>
        <div className="space-y-3">
          <Integ
            title="Supabase (base de datos)"
            desc={
              supabaseConfigurado
                ? 'Variables NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY detectadas en el entorno.'
                : 'Pendiente — configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local.'
            }
            ok={supabaseConfigurado}
          />
          <Integ
            title="Proveedor de mapas (Mapbox / Google)"
            desc={
              mapsHabilitado
                ? 'Clave de mapas detectada en el servidor. Rutas reales habilitadas.'
                : 'Pendiente — Rutas opera en MODO DEMO. Configura MAPBOX_ACCESS_TOKEN o GOOGLE_MAPS_API_KEY en el servidor.'
            }
            ok={mapsHabilitado}
          />
          <Integ
            title="WhatsApp Business (opcional)"
            desc="Puede integrarse con Evolution API para enviar recordatorios de pago."
            optional
          />
        </div>

        <div className="h-px bg-border my-4" />

        <h3 className="font-semibold mb-2">Aviso de privacidad</h3>
        <div className="text-xs text-slate-400">
          Pendiente de redacción y validación legal conforme a la LFPDPPP (México) y las políticas
          de FinCapital. El sistema NO afirma cumplimiento legal automático.
        </div>
      </div>
    </div>
  );
}

function Integ({
  title,
  desc,
  ok,
  optional,
}: {
  title: string;
  desc: string;
  ok?: boolean;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5 max-w-prose">{desc}</div>
      </div>
      {optional ? (
        <Chip className="bg-slate-700/40 text-slate-300 border border-border">Opcional</Chip>
      ) : ok ? (
        <Chip className="bg-emerald-500/15 text-emerald-200">Conectado</Chip>
      ) : (
        <Chip className="bg-orange-500/15 text-orange-200">Pendiente</Chip>
      )}
    </div>
  );
}
