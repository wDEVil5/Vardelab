-- M111: la propiedad de una organización se transfiere con consentimiento.
--
-- Antes, el dueño transfería de inmediato y el destinatario no tenía forma de
-- negarse, aunque con eso pudiera borrar la organización. Ahora el dueño (o un
-- admin) hace una oferta; el destinatario la acepta o la rechaza. Mientras
-- tanto, el dueño sigue siendo el mismo.
--
-- Las ofertas solo se escriben por funciones security definer: la tabla no
-- tiene policies de insert, update ni delete para los clientes.

alter type notification_tipo add value 'organizacion_propiedad_ofrecida';

create table public.organization_ownership_offers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'aceptada', 'rechazada', 'cancelada')),
  created_at timestamptz not null default now()
);

-- Como máximo una oferta pendiente por organización.
create unique index organization_ownership_offers_una_pendiente
  on public.organization_ownership_offers (org_id)
  where status = 'pendiente';

alter table public.organization_ownership_offers enable row level security;

create policy "organization_ownership_offers_select"
  on public.organization_ownership_offers for select
  using (
    from_user = auth.uid()
    or to_user = auth.uid()
    or public.has_role(auth.uid(), 'admin'::app_role)
  );

drop function if exists public.transfer_organization_ownership(uuid, uuid);

create or replace function public.offer_organization_ownership(
  _org_id uuid,
  _new_owner_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_nombre text;
  v_offer uuid;
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

  -- Una oferta nueva reemplaza a la pendiente anterior.
  update public.organization_ownership_offers
  set status = 'cancelada'
  where org_id = _org_id and status = 'pendiente';

  insert into public.organization_ownership_offers (org_id, from_user, to_user)
  values (_org_id, v_owner, _new_owner_id)
  returning id into v_offer;

  insert into public.notifications (user_id, tipo, mensaje, link)
  values (
    _new_owner_id,
    'organizacion_propiedad_ofrecida',
    'Te ofrecieron ser dueño de "' || coalesce(v_nombre, 'una organización') || '". Puedes aceptarla o rechazarla.',
    '/mis-invitaciones'
  );

  insert into public.audit_logs (actor_id, accion, entidad, entidad_id, metadata)
  values (
    auth.uid(),
    'organizacion_propiedad_ofrecida',
    'organizations',
    _org_id,
    jsonb_build_object('dueno_actual', v_owner, 'destinatario', _new_owner_id)
  );

  return v_offer;
end;
$$;

create or replace function public.accept_organization_ownership(_offer_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.organization_ownership_offers%rowtype;
  v_owner uuid;
  v_nombre text;
  v_old_email text;
begin
  select * into v_offer
  from public.organization_ownership_offers
  where id = _offer_id and to_user = auth.uid()
  for update;

  if not found then
    raise exception 'La oferta no existe o no es para ti';
  end if;

  if v_offer.status <> 'pendiente' then
    raise exception 'La oferta ya no está pendiente';
  end if;

  select owner_id, nombre into v_owner, v_nombre
  from public.organizations
  where id = v_offer.org_id
  for update;

  if v_owner is distinct from v_offer.from_user then
    raise exception 'La oferta ya no es válida: el dueño cambió';
  end if;

  if not exists (
    select 1 from public.organization_members
    where org_id = v_offer.org_id and user_id = v_offer.to_user and status = 'activo'
  ) then
    raise exception 'El nuevo dueño debe ser un miembro activo';
  end if;

  if exists (
    select 1 from auth.users
    where id = v_offer.to_user and banned_until > now()
  ) then
    raise exception 'La cuenta destino está suspendida';
  end if;

  select email into v_old_email from auth.users where id = v_offer.from_user;
  if v_old_email is null then
    raise exception 'El dueño actual no tiene correo registrado';
  end if;

  perform set_config('app.transferir_propiedad', 'on', true);
  update public.organizations set owner_id = v_offer.to_user where id = v_offer.org_id;

  delete from public.organization_members
  where org_id = v_offer.org_id and user_id = v_offer.to_user;

  insert into public.organization_members (org_id, user_id, invited_email, status, invited_by)
  values (v_offer.org_id, v_offer.from_user, v_old_email, 'activo', v_offer.to_user)
  on conflict (org_id, lower(invited_email))
  do update set user_id = excluded.user_id, status = 'activo';

  update public.organization_ownership_offers
  set status = 'aceptada'
  where id = _offer_id;

  insert into public.notifications (user_id, tipo, mensaje, link)
  values (
    v_offer.from_user,
    'organizacion_propiedad_transferida',
    'Aceptaron ser dueños de "' || coalesce(v_nombre, 'la organización') || '". Ahora eres miembro.',
    '/mis-organizaciones/' || v_offer.org_id || '/miembros'
  );

  insert into public.audit_logs (actor_id, accion, entidad, entidad_id, metadata)
  values (
    auth.uid(),
    'organizacion_propiedad_transferida',
    'organizations',
    v_offer.org_id,
    jsonb_build_object('anterior_dueno', v_offer.from_user, 'nuevo_dueno', v_offer.to_user)
  );

  return true;
end;
$$;

create or replace function public.decline_organization_ownership_offer(_offer_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  with rechazada as (
    update public.organization_ownership_offers
    set status = 'rechazada'
    where id = _offer_id and to_user = auth.uid() and status = 'pendiente'
    returning id
  )
  select exists (select 1 from rechazada);
$$;

create or replace function public.cancel_organization_ownership_offer(_offer_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  with cancelada as (
    update public.organization_ownership_offers
    set status = 'cancelada'
    where id = _offer_id and status = 'pendiente'
      and (from_user = auth.uid() or public.has_role(auth.uid(), 'admin'::app_role))
    returning id
  )
  select exists (select 1 from cancelada);
$$;

revoke all on function public.offer_organization_ownership(uuid, uuid) from public, anon;
grant execute on function public.offer_organization_ownership(uuid, uuid) to authenticated;

revoke all on function public.accept_organization_ownership(uuid) from public, anon;
grant execute on function public.accept_organization_ownership(uuid) to authenticated;

revoke all on function public.decline_organization_ownership_offer(uuid) from public, anon;
grant execute on function public.decline_organization_ownership_offer(uuid) to authenticated;

revoke all on function public.cancel_organization_ownership_offer(uuid) from public, anon;
grant execute on function public.cancel_organization_ownership_offer(uuid) to authenticated;
