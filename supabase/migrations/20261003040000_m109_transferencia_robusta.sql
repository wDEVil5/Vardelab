-- M109: endurece transfer_organization_ownership tras la auditoría de la propiedad.
--
-- - Un admin puede transferir: M108 bloqueó el cambio directo de owner_id, así
--   que sin esto no quedaba vía de rescate para una organización sin dueño activo.
-- - No se transfiere a una cuenta suspendida: quedaría una organización sin
--   nadie que pueda actuar, y el dueño anterior perdería sus atribuciones.
-- - El dueño anterior siempre queda como miembro activo. Antes, si su correo ya
--   tenía una invitación pendiente, `on conflict do nothing` lo dejaba fuera sin
--   avisar; ahora esa fila se reactiva para él.

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

  if v_owner is null then
    raise exception 'No autorizado';
  end if;

  if v_owner is distinct from auth.uid()
     and not public.has_role(auth.uid(), 'admin'::app_role) then
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

  if exists (
    select 1 from auth.users
    where id = _new_owner_id and banned_until > now()
  ) then
    raise exception 'La cuenta destino está suspendida';
  end if;

  select email into v_old_email from auth.users where id = v_owner;
  if v_old_email is null then
    raise exception 'El dueño actual no tiene correo registrado';
  end if;

  perform set_config('app.transferir_propiedad', 'on', true);
  update public.organizations set owner_id = _new_owner_id where id = _org_id;

  delete from public.organization_members
  where org_id = _org_id and user_id = _new_owner_id;

  insert into public.organization_members (org_id, user_id, invited_email, status, invited_by)
  values (_org_id, v_owner, v_old_email, 'activo', auth.uid())
  on conflict (org_id, lower(invited_email))
  do update set user_id = excluded.user_id, status = 'activo';

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
