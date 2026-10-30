-- ============================================================================
-- FinCapital — TRIGGER DE ALTA DE USUARIOS (sin datos ficticios)
-- ----------------------------------------------------------------------------
-- Este archivo SOLO crea el trigger que, al registrar un usuario en Supabase
-- Auth, crea su fila en public.usuarios. NO siembra clientes ni solicitudes:
-- la base arranca limpia para capturar datos reales.
--
-- Nota: el rol se fuerza a 'asesor' aquí y se refuerza en 003_hardening.
-- Para designar al gerente, hazlo con un UPDATE después de crear su cuenta.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, nombre, correo, rol)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'nombre'), ''), split_part(new.email, '@', 1)),
    new.email,
    'asesor'::role_tipo
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
