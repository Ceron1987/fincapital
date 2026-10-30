'use server';
/**
 * Server Actions de FinCapital — todas las mutaciones pasan por aquí.
 * Cada una valida con Zod, respeta rol y RLS (usa el cliente del usuario
 * autenticado), y revalida la ruta afectada.
 */
import { getCurrentUser, requireGerente } from '@/lib/auth/current-user';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  clienteCreateSchema,
  configUpdateSchema,
  pagoCreateSchema,
  solicitudCreateSchema,
} from '@/lib/validations/schemas';
import { revalidatePath } from 'next/cache';

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

/** Genera un folio tipo PREFIX-#### corto y único por timestamp. */
function folio(prefix: string) {
  return `${prefix}-${Date.now().toString().slice(-7)}`;
}

// ---------------------------------------------------------------- CLIENTES
export async function crearCliente(input: unknown): Promise<ActionResult> {
  const u = await getCurrentUser().catch(() => null);
  if (!u) return { ok: false, error: 'No autenticado' };

  const parsed = clienteCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }
  const d = parsed.data;
  const supabase = createServerSupabase();

  // Un asesor solo puede asignar clientes a sí mismo; el gerente a quien sea.
  const asesor_id =
    u.perfil.rol === 'gerente' ? (d.asesor_id ?? null) : u.perfil.id;

  const { data, error } = await supabase
    .from('clientes')
    .insert({
      folio: folio('C'),
      nombre: d.nombre,
      telefono: d.telefono || null,
      giro: d.giro || null,
      direccion: d.direccion || null,
      colonia: d.colonia || null,
      antiguedad_negocio: d.antiguedad_negocio || null,
      asesor_id,
      estado: 'prospecto',
      created_by: u.perfil.id,
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };

  await supabase.from('auditoria').insert({
    usuario_id: u.perfil.id,
    entidad: 'cliente',
    entidad_id: data.id,
    evento: 'alta_cliente',
    detalle: { nombre: d.nombre },
  });

  revalidatePath('/clientes');
  return { ok: true, id: data.id };
}

// ------------------------------------------------------------- SOLICITUDES
export async function crearSolicitud(input: unknown): Promise<ActionResult> {
  const u = await getCurrentUser().catch(() => null);
  if (!u) return { ok: false, error: 'No autenticado' };

  const parsed = solicitudCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }
  const d = parsed.data;
  const supabase = createServerSupabase();

  // asesor dueño del cliente o gerente
  const { data: cli } = await supabase
    .from('clientes')
    .select('asesor_id')
    .eq('id', d.cliente_id)
    .single();
  if (!cli) return { ok: false, error: 'Cliente no encontrado' };

  const asesor_id =
    u.perfil.rol === 'gerente' ? (cli.asesor_id ?? u.perfil.id) : u.perfil.id;

  const { data, error } = await supabase
    .from('solicitudes')
    .insert({
      folio: folio('S'),
      cliente_id: d.cliente_id,
      asesor_id,
      tipo: d.tipo,
      monto_solicitado_centavos: d.monto_solicitado_centavos,
      plazo_meses: d.plazo_meses ?? null,
      destino_uso: d.destino_uso || null,
      comentarios: d.comentarios || null,
      semaforo: 'amarillo',
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };

  await supabase.from('auditoria').insert({
    usuario_id: u.perfil.id,
    entidad: 'solicitud',
    entidad_id: data.id,
    evento: 'alta_solicitud',
    detalle: { monto_centavos: d.monto_solicitado_centavos },
  });

  revalidatePath('/solicitudes');
  revalidatePath('/autorizacion');
  return { ok: true, id: data.id };
}

// ------------------------------------------------------------------- PAGOS
export async function registrarPago(input: unknown): Promise<ActionResult> {
  const u = await getCurrentUser().catch(() => null);
  if (!u) return { ok: false, error: 'No autenticado' };

  const parsed = pagoCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }
  const d = parsed.data;
  const supabase = createServerSupabase();

  const { data: cr } = await supabase
    .from('creditos')
    .select('cliente_id, asesor_id')
    .eq('id', d.credito_id)
    .single();
  if (!cr) return { ok: false, error: 'Crédito no encontrado' };

  const { data, error } = await supabase
    .from('pagos')
    .insert({
      folio: folio('P'),
      credito_id: d.credito_id,
      cliente_id: cr.cliente_id,
      asesor_id: u.perfil.rol === 'gerente' ? cr.asesor_id : u.perfil.id,
      monto_centavos: d.monto_centavos,
      fecha_pago: d.fecha_pago ?? new Date().toISOString().slice(0, 10),
      reportado_por: u.perfil.id,
      conciliado: false,
      comentarios: d.comentarios || null,
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };

  await supabase.from('auditoria').insert({
    usuario_id: u.perfil.id,
    entidad: 'pago',
    entidad_id: data.id,
    evento: 'registrar_pago',
    detalle: { monto_centavos: d.monto_centavos },
  });

  revalidatePath('/cobranza');
  return { ok: true, id: data.id };
}

// ----------------------------------------------------------- CONFIGURACIÓN
export async function guardarConfig(input: unknown): Promise<ActionResult> {
  try {
    await requireGerente();
  } catch (e: any) {
    return { ok: false, error: e.message ?? 'Reservado al gerente' };
  }

  const parsed = configUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }
  const d = parsed.data;

  if (d.monto_minimo_nuevo_centavos > d.monto_maximo_nuevo_centavos) {
    return { ok: false, error: 'El monto mínimo no puede ser mayor al máximo.' };
  }
  if (d.plazo_min_meses > d.plazo_max_meses) {
    return { ok: false, error: 'El plazo mínimo no puede ser mayor al máximo.' };
  }

  const u = await getCurrentUser();
  const supabase = createServerSupabase();

  const { error } = await supabase
    .from('configuracion')
    .update({
      monto_minimo_nuevo_centavos: d.monto_minimo_nuevo_centavos,
      monto_maximo_nuevo_centavos: d.monto_maximo_nuevo_centavos,
      incremento_renovacion_centavos: d.incremento_renovacion_centavos,
      tarifa_renovacion_centavos: d.tarifa_renovacion_centavos,
      limite_renovacion_centavos: d.limite_renovacion_centavos,
      meta_semanal_default_centavos: d.meta_semanal_default_centavos,
      plazo_min_meses: d.plazo_min_meses,
      plazo_max_meses: d.plazo_max_meses,
      antiguedad_minima_meses: d.antiguedad_minima_meses,
      contacto_whatsapp: d.contacto_whatsapp || null,
      horario_atencion: d.horario_atencion || null,
      updated_by: u?.perfil.id ?? null,
    })
    .eq('id', 'singleton');

  if (error) return { ok: false, error: error.message };

  await supabase.from('auditoria').insert({
    usuario_id: u?.perfil.id ?? null,
    entidad: 'configuracion',
    evento: 'actualizar_config',
    detalle: null,
  });

  revalidatePath('/configuracion');
  revalidatePath('/solicitudes');
  return { ok: true };
}
