-- ============================================================================
-- M56 · Cambio de rol atómico
--
-- `changeUserRole` (panel admin, D-03) borraba todos los roles del usuario y
-- después insertaba el nuevo con dos llamadas separadas desde el cliente de
-- Supabase, sin transacción. Si el `delete` funcionaba pero el `insert`
-- fallaba (una caída de red, por ejemplo), la persona quedaba sin ningún rol
-- hasta que alguien se lo volviera a asignar a mano.
--
-- Una función de Postgres corre en una sola transacción implícita: si algo
-- falla adentro, se revierte todo. La autorización queda dentro de la función
-- (no solo en la Server Action) porque es `security definer` y cualquier
-- usuario autenticado podría invocarla directo vía `rpc()`.
-- ============================================================================

create or replace function public.set_user_role(_user_id uuid, _role public.app_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'No autorizado.';
  end if;

  delete from public.user_roles where user_id = _user_id;
  insert into public.user_roles (user_id, role) values (_user_id, _role);
end;
$$;
