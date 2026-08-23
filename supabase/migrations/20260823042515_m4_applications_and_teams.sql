-- ============================================================================
-- M4 · Postulaciones y equipos:
--   applications  → postulación de un estudiante a un rol de un proyecto
--   teams         → equipo conformado para un proyecto (uno por proyecto)
--   team_members  → integrantes del equipo y el rol que cubren
-- ============================================================================

-- 1) TABLA applications ------------------------------------------------------
-- Un estudiante se postula a un rol concreto (project_role_id). El estado usa
-- el enum application_status de M0 (enviada, aceptada, rechazada, retirada).
-- unique(project_role_id, applicant_id): una sola postulación por rol y persona.
-- ON DELETE CASCADE en ambos FKs: la postulación no tiene sentido sin su rol ni
-- sin su autor.
create table public.applications (
  id              uuid primary key default gen_random_uuid(),
  project_role_id uuid not null references public.project_roles (id) on delete cascade,
  applicant_id    uuid not null references auth.users (id) on delete cascade,
  status          application_status not null default 'enviada',
  mensaje         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (project_role_id, applicant_id)
);

create index applications_role_id_idx      on public.applications (project_role_id);
create index applications_applicant_id_idx on public.applications (applicant_id);

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- 2) TABLA teams -------------------------------------------------------------
-- Equipo del proyecto. project_id es UNIQUE: un proyecto tiene a lo sumo un
-- equipo. ON DELETE CASCADE: al borrar el proyecto cae su equipo.
create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null unique references public.projects (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger teams_set_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();

-- 3) TABLA team_members ------------------------------------------------------
-- Integrantes del equipo. project_role_id indica qué rol cubre cada quien;
-- usa SET NULL para conservar al integrante aunque se elimine la definición
-- del rol. unique(team_id, user_id): una persona aparece una sola vez por equipo.
create table public.team_members (
  id              uuid primary key default gen_random_uuid(),
  team_id         uuid not null references public.teams (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  project_role_id uuid references public.project_roles (id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (team_id, user_id)
);

create index team_members_team_id_idx on public.team_members (team_id);
create index team_members_user_id_idx on public.team_members (user_id);

-- 4) FUNCIONES HELPER de permisos --------------------------------------------
-- Se definen después de las tablas (una función 'language sql' se valida contra
-- los objetos existentes al crearse). 'security definer' hace que salten la RLS
-- de las tablas que consultan: además de evitar recursión, permite que teams y
-- team_members se referencien entre sí sin que sus políticas se disparen en
-- cadena.

-- ¿El usuario gestiona el proyecto al que pertenece este rol?
create or replace function public.can_manage_role(_role_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_roles r
    join public.projects p      on p.id = r.project_id
    join public.organizations o on o.id = p.org_id
    where r.id = _role_id and o.owner_id = auth.uid()
  );
$$;

-- ¿El usuario gestiona el proyecto de este equipo?
create or replace function public.can_manage_team(_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.teams t
    join public.projects p      on p.id = t.project_id
    join public.organizations o on o.id = p.org_id
    where t.id = _team_id and o.owner_id = auth.uid()
  );
$$;

-- ¿El usuario integra este equipo?
create or replace function public.is_team_member(_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members m
    where m.team_id = _team_id and m.user_id = auth.uid()
  );
$$;

-- 5) ROW LEVEL SECURITY ------------------------------------------------------
alter table public.applications enable row level security;
alter table public.teams        enable row level security;
alter table public.team_members enable row level security;

-- applications: ve su postulación el propio autor; y quien gestiona el proyecto
-- del rol (para revisar candidatos). Un admin ve todo.
create policy "applications_select_own_or_manager"
  on public.applications for select
  using (
    applicant_id = auth.uid()
    or public.can_manage_role(project_role_id)
    or public.has_role(auth.uid(), 'admin')
  );

-- applications: el estudiante se postula por sí mismo y solo a un rol de un
-- proyecto publicado.
create policy "applications_insert_own"
  on public.applications for insert
  with check (
    applicant_id = auth.uid()
    and exists (
      select 1
      from public.project_roles r
      join public.projects p on p.id = r.project_id
      where r.id = project_role_id and p.status = 'publicado'
    )
  );

-- applications: el autor la modifica (p. ej. retirarla) y el gestor decide su
-- estado (aceptar/rechazar).
create policy "applications_update_own_or_manager"
  on public.applications for update
  using (
    applicant_id = auth.uid()
    or public.can_manage_role(project_role_id)
    or public.has_role(auth.uid(), 'admin')
  )
  with check (
    applicant_id = auth.uid()
    or public.can_manage_role(project_role_id)
    or public.has_role(auth.uid(), 'admin')
  );

-- applications: el autor puede borrar la suya; también un admin.
create policy "applications_delete_own"
  on public.applications for delete
  using (applicant_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- teams: lo ven sus integrantes, quien gestiona el proyecto y un admin.
create policy "teams_select_member_or_manager"
  on public.teams for select
  using (
    public.is_team_member(id)
    or public.can_manage_team(id)
    or public.has_role(auth.uid(), 'admin')
  );

-- teams: solo quien gestiona el proyecto crea su equipo.
create policy "teams_insert_manager"
  on public.teams for insert
  with check (public.can_manage_project(project_id) or public.has_role(auth.uid(), 'admin'));

-- teams: edición/borrado del equipo, solo gestor o admin.
create policy "teams_update_manager"
  on public.teams for update
  using (public.can_manage_team(id) or public.has_role(auth.uid(), 'admin'))
  with check (public.can_manage_team(id) or public.has_role(auth.uid(), 'admin'));

create policy "teams_delete_manager"
  on public.teams for delete
  using (public.can_manage_team(id) or public.has_role(auth.uid(), 'admin'));

-- team_members: cada integrante se ve a sí mismo; el gestor ve la nómina completa.
create policy "team_members_select_self_or_manager"
  on public.team_members for select
  using (
    user_id = auth.uid()
    or public.can_manage_team(team_id)
    or public.has_role(auth.uid(), 'admin')
  );

-- team_members: la nómina la administra quien gestiona el proyecto (arma el
-- equipo a partir de las postulaciones aceptadas) o un admin.
create policy "team_members_write_manager"
  on public.team_members for all
  using (public.can_manage_team(team_id) or public.has_role(auth.uid(), 'admin'))
  with check (public.can_manage_team(team_id) or public.has_role(auth.uid(), 'admin'));
