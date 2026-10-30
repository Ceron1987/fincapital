import { NuevoClienteForm } from '@/components/forms/nuevo-cliente-form';
import { getCurrentUser } from '@/lib/auth/current-user';
import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NuevoClientePage() {
  const u = await getCurrentUser();
  if (!u) redirect('/login');
  const supabase = createServerSupabase();

  const esGerente = u.perfil.rol === 'gerente';
  const [{ data: asesores }, { data: cfg }] = await Promise.all([
    esGerente
      ? supabase.from('usuarios').select('id, nombre').eq('rol', 'asesor').eq('activo', true)
      : Promise.resolve({ data: [] as any[] }),
    supabase
      .from('configuracion')
      .select('antiguedad_minima_meses, giros_objetivo')
      .eq('id', 'singleton')
      .single(),
  ]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nuevo cliente</h1>
        <p className="text-sm text-slate-500">Alta de prospecto / negocio en la cartera.</p>
      </div>
      <NuevoClienteForm
        asesores={asesores ?? []}
        esGerente={esGerente}
        antiguedadMinMeses={cfg?.antiguedad_minima_meses ?? 6}
        girosObjetivo={
          cfg?.giros_objetivo ?? ['Tortillería', 'Abarrotes/Tiendita', 'Miscelánea', 'Papelería', 'Comercio']
        }
      />
    </>
  );
}
