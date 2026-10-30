import { RegistrarPagoForm } from '@/components/forms/registrar-pago-form';
import { EmptyState } from '@/components/ui/empty';
import { getCurrentUser } from '@/lib/auth/current-user';
import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NuevoPagoPage() {
  const u = await getCurrentUser();
  if (!u) redirect('/login');
  const supabase = createServerSupabase();

  const { data: creditos } = await supabase
    .from('creditos')
    .select('id, folio, saldo_centavos, clientes(nombre)')
    .eq('estado', 'activo')
    .order('fecha_desembolso', { ascending: false })
    .limit(500);

  const opts =
    (creditos ?? []).map((c: any) => ({
      id: c.id,
      folio: c.folio,
      nombre: c.clientes?.nombre ?? '—',
      saldo_centavos: Number(c.saldo_centavos),
    })) ?? [];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Registrar pago</h1>
        <p className="text-sm text-slate-500">Cobranza reportada; el gerente la concilia después.</p>
      </div>
      {opts.length === 0 ? (
        <EmptyState
          title="No hay créditos activos"
          description="Primero debe existir un crédito desembolsado para registrar pagos."
          icon="💳"
        />
      ) : (
        <RegistrarPagoForm creditos={opts} />
      )}
    </>
  );
}
