-- M110: las invitaciones a una organización requieren aceptación.
--
-- Antes, invitar a una cuenta existente la dejaba activa de inmediato, y
-- handle_new_user activaba las invitaciones pendientes al registrarse. Un
-- co-gestor podía sumar a alguien con acceso total a los proyectos sin que la
-- persona lo aceptara. Ahora la invitación queda pendiente hasta que la persona
-- la acepta (accept_organization_invitation) o la rechaza borrando su fila, que
-- la policy de delete ya permite a quien es invitado.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _rol app_role;
begin
  -- 1) Profile (igual que en M1).
  insert into public.profiles (id, nombre)
  values (new.id, new.raw_user_meta_data ->> 'nombre');

  -- 2) Rol inicial desde la metadata, restringido a la lista blanca (M11).
  _rol := case new.raw_user_meta_data ->> 'rol'
            when 'patrocinador' then 'patrocinador'::app_role
            else 'estudiante'::app_role
          end;

  insert into public.user_roles (user_id, role)
  values (new.id, _rol)
  on conflict (user_id, role) do nothing;

  -- 3) Vincula las invitaciones que esperaban este correo, sin aceptarlas: la
  -- persona las acepta después desde su bandeja (M110).
  update public.organization_members
  set user_id = new.id
  where user_id is null
    and lower(invited_email) = lower(new.email)
    and status = 'pendiente';

  return new;
end;
$$;

create or replace function public.accept_organization_invitation(_member_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.organization_members
  set status = 'activo'
  where id = _member_id
    and user_id = auth.uid()
    and status = 'pendiente';
  return found;
end;
$$;

revoke all on function public.accept_organization_invitation(uuid) from public, anon;
grant execute on function public.accept_organization_invitation(uuid) to authenticated;
