-- M108: cierra dos lagunas en la propiedad de las organizaciones.
--
-- 1) M38 dejó que cualquier miembro activo actualizara cualquier columna de
--    `organizations`, incluido `owner_id`: un miembro podía apropiarse de la
--    organización sin pasar por transfer_organization_ownership. Un trigger
--    deja que `owner_id` cambie solo desde esa función, que activa una marca
--    local de transacción antes de actualizar.
-- 2) La policy de update de `organization_members` dejaba a cualquier miembro
--    activar o reescribir invitaciones ajenas. Ahora solo las modifica el dueño
--    (o un admin). La app no hace update sobre esa tabla; las invitaciones se
--    activan con handle_new_user, que es security definer.

create or replace function public.organizations_guard_owner()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.owner_id is distinct from old.owner_id
     and coalesce(current_setting('app.transferir_propiedad', true), '') <> 'on' then
    raise exception 'La propiedad solo se transfiere con transfer_organization_ownership';
  end if;
  return new;
end;
$$;

drop trigger if exists organizations_guard_owner on public.organizations;
create trigger organizations_guard_owner
  before update on public.organizations
  for each row
  execute function public.organizations_guard_owner();

drop policy if exists "organization_members_update" on public.organization_members;
create policy "organization_members_update"
  on public.organization_members for update
  using (
    exists (
      select 1 from public.organizations o
      where o.id = org_id and o.owner_id = auth.uid()
    )
    or public.has_role(auth.uid(), 'admin'::app_role)
  )
  with check (
    exists (
      select 1 from public.organizations o
      where o.id = org_id and o.owner_id = auth.uid()
    )
    or public.has_role(auth.uid(), 'admin'::app_role)
  );

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

  perform set_config('app.transferir_propiedad', 'on', true);
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
