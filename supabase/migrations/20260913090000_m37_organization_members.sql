-- ============================================================================
-- M37 · Miembros de organización (backend)
--
-- Primera pieza de "más de un dueño por organización": una tabla de
-- invitaciones/membresías, sin todavía cambiar quién puede ver/gestionar
-- proyectos (eso sigue siendo por `created_by`/`owner_id` — se revisa en un
-- paso aparte, más grande, que toca RLS y queries de projects/milestones/
-- applications/evaluations). Por ahora esto solo deja invitar por correo
-- (exista o no la cuenta todavía) y guardar la membresía; sin UI de gestión
-- todavía — se agrega en otra sesión, junto con el "Próximamente" visible.
--
-- Se invita por correo sin importar si ya es usuario: si `find_user_id_by_email`
-- encuentra una cuenta, la fila queda 'activa' de una; si no, queda 'pendiente'
-- (user_id null) hasta que esa persona se registre con ese correo — el trigger
-- de abajo la activa en ese momento, mismo patrón que M11 (rol inicial).
-- ============================================================================

-- 1) Tabla ---------------------------------------------------------------

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'activo')),
  invited_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- Un mismo correo no puede estar invitado dos veces a la misma organización.
create unique index organization_members_org_email_key
  on public.organization_members (org_id, lower(invited_email));

create index organization_members_user_id_idx on public.organization_members (user_id);

alter table public.organization_members enable row level security;

-- 2) Helpers ---------------------------------------------------------------

-- Encuentra el id de un usuario ya registrado por correo (case-insensitive).
-- security definer porque auth.users no es legible por el rol normal; solo
-- expone el id (o null), nada más del usuario.
create or replace function public.find_user_id_by_email(_email text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from auth.users where lower(email) = lower(_email) limit 1;
$$;

-- Dueño de la organización, o miembro ya activo. Reemplaza a "solo owner_id"
-- como el chequeo de pertenencia a una organización.
create or replace function public.is_org_member(_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organizations o
    where o.id = _org_id and o.owner_id = auth.uid()
  ) or exists (
    select 1 from public.organization_members m
    where m.org_id = _org_id and m.user_id = auth.uid() and m.status = 'activo'
  );
$$;

-- 3) RLS ---------------------------------------------------------------------

-- Ve las membresías de una organización: el dueño, cualquier miembro activo de
-- esa organización (todos con el mismo nivel, por ahora), un admin, o la
-- propia fila de quien fue invitado (para que en algún momento vea sus
-- invitaciones pendientes, aunque todavía no exista la pantalla).
create policy "organization_members_select"
  on public.organization_members for select
  using (
    public.is_org_member(org_id)
    or user_id = auth.uid()
    or public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Invita: el dueño o cualquier miembro activo (mismos permisos que el dueño),
-- o un admin.
create policy "organization_members_insert"
  on public.organization_members for insert
  with check (
    public.is_org_member(org_id)
    or public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Actualiza (ej. reenviar/editar una invitación): mismo criterio que insertar.
-- La activación automática al registrarse corre en `handle_new_user`, que es
-- security definer y no pasa por RLS.
create policy "organization_members_update"
  on public.organization_members for update
  using (
    public.is_org_member(org_id)
    or public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Elimina (sacar a alguien, o irse uno mismo): dueño/miembro activo, un admin,
-- o el propio invitado (incluida una invitación pendiente que quiera declinar).
create policy "organization_members_delete"
  on public.organization_members for delete
  using (
    public.is_org_member(org_id)
    or user_id = auth.uid()
    or public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 4) Activar invitaciones pendientes al registrarse ---------------------------

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

  -- 3) Invitaciones a organizaciones que quedaron esperando este correo (M37).
  update public.organization_members
  set user_id = new.id, status = 'activo'
  where user_id is null
    and lower(invited_email) = lower(new.email)
    and status = 'pendiente';

  return new;
end;
$$;
