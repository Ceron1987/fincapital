import { NuevaSolicitudForm } from '@/components/forms/nueva-solicitud-form';
import { EmptyState } from '@/components/ui/empty';
import { getCurrentUser } from '@/lib/auth/current-user';
import { createServerSupabase } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NuevaSolicitudPage({
  searchParams,
}: {
  searchParams: { cliente?: string };
}) {
  const u = await getCurrentUser();
  if (!u) redirect('/login');
  const supabase = createServerSupabase();

  const [{ data: clientes }, { data: cfg }] = await Promise.all([
    supabase.from('clientes').select('id, folio, nombre').order('nombre').limit(500),
    supabase
      .from('configuracion')
      .select('monto_minimo_nuevo_centavos, monto_maximo_nuevo_centavos, plazo_min_meses, plazo_max_meses')
      .eq('id', 'singleton')
      .single(),
  ]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nueva solicitud de crédito</h1>
        <p className="text-sm text-slate-500">Captura y envía al gerente para autorización.</p>
      </div>
      {!clientes || clientes.length === 0 ? (
        <EmptyState
          title="Primero da de alta un cliente"
          description="No hay clientes en tu cartera para crear una solicitud."
          icon="👥"
        />
      ) : (
        <NuevaSolicitudForm
          clientes={clientes}
          clientePre={searchParams.cliente}
          montoMin={cfg?.monto_minimo_nuevo_centavos ?? 700000}
          montoMax={cfg?.monto_maximo_nuevo_centavos ?? 1000000}
          plazoMin={cfg?.plazo_min_meses ?? 12}
          plazoMax={cfg?.plazo_max_meses ?? 36}
        />
      )}
      <div className="mt-4">
        <Link href="/clientes/nuevo" className="text-xs text-brand-cyan underline">
          + ¿El cliente no está? Darlo de alta primero
        </Link>
      </div>
    </>
  );
}
