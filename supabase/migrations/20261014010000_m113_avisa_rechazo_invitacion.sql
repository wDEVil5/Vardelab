-- M113: avisa a quien invitó cuando rechazan su invitación de co-gestión.
--
-- Antes, rechazar una invitación era un delete directo del cliente sobre la
-- propia fila pendiente (RLS `organization_members_delete`). Funcionaba, pero
-- nadie se enteraba. Se reemplaza por una función security definer, mismo
-- criterio que accept_organization_invitation (M110): borra la fila y, si
-- había quien invitó, le deja un aviso in-app (el correo lo manda la Server
-- Action, como en M112).

alter type notification_tipo add value 'organizacion_invitacion_rechazada';

create or replace function public.decline_organization_invitation(_member_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_invitador uuid;
  v_nombre_org text;
  v_nombre_rechaza text;
begin
  delete from public.organization_members
  where id = _member_id
    and user_id = auth.uid()
    and status = 'pendiente'
  returning org_id, invited_by into v_org, v_invitador;

  if not found then
    return false;
  end if;

  if v_invitador is not null then
    select nombre into v_nombre_org from public.organizations where id = v_org;
    select nombre into v_nombre_rechaza from public.profiles where id = auth.uid();

    insert into public.notifications (user_id, tipo, mensaje, link)
    values (
      v_invitador,
      'organizacion_invitacion_rechazada',
      coalesce(v_nombre_rechaza, 'Alguien') || ' rechazó tu invitación a "'
        || coalesce(v_nombre_org, 'la organización') || '".',
      '/mis-organizaciones/' || v_org || '/miembros'
    );
  end if;

  return true;
end;
$$;

revoke all on function public.decline_organization_invitation(uuid) from public, anon;
grant execute on function public.decline_organization_invitation(uuid) to authenticated;
