-- M106: transferir la propiedad de una organización a un miembro activo.
--
-- Decisiones (confirmadas con el dueño del piloto, 2026-10-03):
-- - Solo el dueño actual puede transferir: ni un co-gestor ni un admin.
-- - El destinatario debe ser miembro activo, no una invitación pendiente.
-- - El dueño anterior queda como miembro activo, así que no pierde acceso de golpe.
-- - La notificación in-app y el registro de auditoría van en la misma transacción.
--   El correo lo despacha la Server Action después del éxito.

alter type notification_tipo add value 'organizacion_propiedad_transferida';

create or replace function public.transfer_organization_ownership(
  _org_id uuid,
  _new_owner_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_nombre text;
  v_old_email text;
begin
  select owner_id, nombre into v_owner, v_nombre
  from public.organizations
  where id = _org_id
  for update;

  if v_owner is null or v_owner is distinct from auth.uid() then
    raise exception 'No autorizado';
  end if;

  if _new_owner_id = v_owner then
    raise exception 'Ya es el dueño de la organización';
  end if;

  if not exists (
    select 1 from public.organization_members
    where org_id = _org_id and user_id = _new_owner_id and status = 'activo'
  ) then
    raise exception 'El nuevo dueño debe ser un miembro activo';
  end if;

  select email into v_old_email from auth.users where id = v_owner;

  update public.organizations set owner_id = _new_owner_id where id = _org_id;

  delete from public.organization_members
  where org_id = _org_id and user_id = _new_owner_id;

  insert into public.organization_members (org_id, user_id, invited_email, status, invited_by)
  values (_org_id, v_owner, coalesce(v_old_email, ''), 'activo', auth.uid())
  on conflict (org_id, lower(invited_email)) do nothing;

  insert into public.notifications (user_id, tipo, mensaje, link)
  values (
    _new_owner_id,
    'organizacion_propiedad_transferida',
    'Ahora eres el dueño de "' || coalesce(v_nombre, 'la organización') || '".',
    '/mis-organizaciones/' || _org_id || '/editar'
  );

  insert into public.audit_logs (actor_id, accion, entidad, entidad_id, metadata)
  values (
    auth.uid(),
    'organizacion_propiedad_transferida',
    'organizations',
    _org_id,
    jsonb_build_object('anterior_dueno', v_owner, 'nuevo_dueno', _new_owner_id)
  );
end;
$$;

revoke all on function public.transfer_organization_ownership(uuid, uuid) from public, anon;
grant execute on function public.transfer_organization_ownership(uuid, uuid) to authenticated;
