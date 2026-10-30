-- ============================================================================
-- FinCapital — Campos específicos del producto
-- Fecha: 2026-10-29
-- ----------------------------------------------------------------------------
-- Agrega:
--   - plazo del crédito (meses) en solicitudes y creditos
--   - reglas de plazo (12-36 meses) y antigüedad mínima (6 meses) en config
--   - giros objetivo precargados (referencia, editable)
--   - datos de contacto de FinCapital en configuracion
-- Todos los valores son CONFIGURABLES desde la tabla configuracion.
-- ============================================================================

-- Plazo en la solicitud (lo propone el asesor, lo confirma el gerente)
alter table public.solicitudes
  add column if not exists plazo_meses int check (plazo_meses is null or plazo_meses between 1 and 120);

-- Plazo en el crédito desembolsado
alter table public.creditos
  add column if not exists plazo_meses int check (plazo_meses is null or plazo_meses between 1 and 120);

-- Reglas de plazo y antigüedad en configuración
alter table public.configuracion
  add column if not exists plazo_min_meses int not null default 12,
  add column if not exists plazo_max_meses int not null default 36,
  add column if not exists antiguedad_minima_meses int not null default 6,
  add column if not exists giros_objetivo text[] default array['Tortillería','Abarrotes/Tiendita','Miscelánea','Papelería','Comercio'],
  add column if not exists contacto_whatsapp text default '442 486 4772',
  add column if not exists horario_atencion text default '8:00 am – 8:00 pm',
  add column if not exists nombre_empresa text default 'FinCapital';

-- Asegura la fila singleton
insert into public.configuracion (id) values ('singleton')
on conflict (id) do nothing;
