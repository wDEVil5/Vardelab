-- M112: avisos que faltaban cuando alguien responde a una organización.
--
-- Al aceptar una invitación, quien invitó no se enteraba. Al rechazar una
-- oferta de propiedad, el dueño tampoco. Ahora ambas respuestas dejan una
-- notificación in-app (y el correo lo envía la Server Action que las llama).
-- La de propiedad rechazada además queda en auditoría, igual que la oferta.

alter type notification_tipo add value 'organizacion_invitacion_aceptada';
alter type notification_tipo add value 'organizacion_propiedad_rechazada';

create or replace function public.accept_organization_invitation(_member_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_invitador uuid;
  v_nombre_org text;
  v_nombre_aceptante text;
begin
  update public.organization_members
  set status = 'activo'
  where id = _member_id
    and user_id = auth.uid()
    and status = 'pendiente'
  returning org_id, invited_by into v_org, v_invitador;

  if not found then
    return false;
  end if;

  select nombre into v_nombre_org from public.organizations where id = v_org;
  select nombre into v_nombre_aceptante from public.profiles where id = auth.uid();

  if v_invitador is not null then
    insert into public.notifications (user_id, tipo, mensaje, link)
    values (
      v_invitador,
      'organizacion_invitacion_aceptada',
      coalesce(v_nombre_aceptante, 'Alguien') || ' aceptó tu invitación a "'
        || coalesce(v_nombre_org, 'la organización') || '".',
      '/mis-organizaciones/' || v_org || '/miembros'
    );
  end if;

  return true;
end;
$$;

drop function if exists public.decline_organization_ownership_offer(uuid);

create or replace function public.decline_organization_ownership_offer(_offer_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_dueno_actual uuid;
  v_nombre_org text;
  v_nombre_destino text;
begin
  update public.organization_ownership_offers
  set status = 'rechazada'
  where id = _offer_id
    and to_user = auth.uid()
    and status = 'pendiente'
  returning org_id, from_user into v_org, v_dueno_actual;

  if not found then
    return false;
  end if;

  select nombre into v_nombre_org from public.organizations where id = v_org;
  select nombre into v_nombre_destino from public.profiles where id = auth.uid();

  insert into public.notifications (user_id, tipo, mensaje, link)
  values (
    v_dueno_actual,
    'organizacion_propiedad_rechazada',
    coalesce(v_nombre_destino, 'Alguien') || ' rechazó ser dueño de "'
      || coalesce(v_nombre_org, 'la organización') || '". Sigues siendo el dueño.',
    '/mis-organizaciones/' || v_org || '/miembros'
  );

  insert into public.audit_logs (actor_id, accion, entidad, entidad_id, metadata)
  values (
    auth.uid(),
    'organizacion_propiedad_rechazada',
    'organizations',
    v_org,
    jsonb_build_object('dueno_actual', v_dueno_actual, 'destinatario', auth.uid())
  );

  return true;
end;
$$;

revoke all on function public.decline_organization_ownership_offer(uuid) from public, anon;
grant execute on function public.decline_organization_ownership_offer(uuid) to authenticated;
