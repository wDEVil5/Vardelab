-- ============================================================================
-- M88 · Pantalla informativa al pasar a moderador
--
-- Cuando una cuenta pasa a moderador (desde /admin/usuarios), no recibía
-- ningún contexto sobre en qué consiste el rol antes de caer directo al
-- panel de moderación. Se agrega un flag separado de `onboarding_completado`
-- (M87): ese es sobre completar el perfil de estudiante, este es sobre
-- explicar el rol la primera vez que alguien lo tiene — son dos cosas
-- distintas, con su propio flag cada una.
-- ============================================================================

-- `default true`, no `false` + backfill como en M87: la semántica acá es al
-- revés de `onboarding_completado` (ese arranca "falta hacerlo" para
-- cualquiera nuevo). Este flag arranca "no hace falta" para CUALQUIER
-- cuenta — estudiante, patrocinador, o incluso una ya moderadora — y solo
-- `set_user_role` (abajo) lo pone en false, a propósito, en el momento
-- exacto de una promoción real. Con eso ya alcanza: no hace falta ningún
-- backfill, `default true` deja a todas las filas existentes en el estado
-- correcto de una sola vez.
alter table public.profiles
  add column moderador_intro_completado boolean not null default true;

-- `set_user_role` (M56) reemplaza los roles de una cuenta; se envuelve para
-- que, al asignar 'moderador' por primera vez, reabra el flag de la intro.
-- CREATE OR REPLACE conserva el `security definer`/`search_path` original.
create or replace function public.set_user_role(_user_id uuid, _role public.app_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ya_era_moderador boolean;
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'No autorizado.';
  end if;

  -- Se guarda antes del delete/insert: sin esto, un admin re-guardando el
  -- mismo rol "moderador" para alguien que ya lo tenía reabriría la intro
  -- cada vez, no solo la primera.
  ya_era_moderador := exists (
    select 1 from public.user_roles where user_id = _user_id and role = 'moderador'
  );

  delete from public.user_roles where user_id = _user_id;
  insert into public.user_roles (user_id, role) values (_user_id, _role);

  if _role = 'moderador' and not ya_era_moderador then
    update public.profiles
    set moderador_intro_completado = false
    where id = _user_id;
  end if;
end;
$$;
