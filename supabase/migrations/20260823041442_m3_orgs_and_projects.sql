-- ============================================================================
-- M3 · Núcleo del producto:
--   organizations  → organización patrocinadora
--   projects       → microproyecto publicado por una organización
--   project_roles  → cupos/roles que el proyecto necesita cubrir
--   project_role_skills → habilidades exigidas por cada rol
-- ============================================================================

-- 1) TABLA organizations -----------------------------------------------------
-- Entidad patrocinadora. owner_id es el usuario que la crea y la administra.
-- ON DELETE CASCADE: si se borra el usuario dueño, cae la organización.
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  nombre      text not null,
  tipo        org_type not null,
  descripcion text,
  sitio_web   text,
  logo_url    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index organizations_owner_id_idx on public.organizations (owner_id);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- 2) TABLA projects ----------------------------------------------------------
-- El microproyecto. org_id lo enlaza a su organización; created_by registra
-- quién lo publicó. status arranca en 'borrador' (enum de 9 estados, PRD §6.2).
-- ON DELETE de org_id es CASCADE: al borrar la organización caen sus proyectos.
-- created_by usa SET NULL: si se borra la persona, el proyecto se conserva.
create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations (id) on delete cascade,
  created_by   uuid references auth.users (id) on delete set null,
  titulo       text not null,
  resumen      text,
  descripcion  text,
  status       project_status not null default 'borrador',
  fecha_inicio date,
  fecha_fin    date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index projects_org_id_idx on public.projects (org_id);
create index projects_status_idx on public.projects (status);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- 3) TABLA project_roles -----------------------------------------------------
-- Roles/cupos que el proyecto busca cubrir (ej. "2 Frontend", "1 UX").
-- cupos > 0 lo garantiza el CHECK. ON DELETE CASCADE: los roles pertenecen al
-- proyecto y no tienen sentido sin él.
create table public.project_roles (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  nombre      text not null,
  descripcion text,
  cupos       int not null default 1 check (cupos > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index project_roles_project_id_idx on public.project_roles (project_id);

create trigger project_roles_set_updated_at
  before update on public.project_roles
  for each row execute function public.set_updated_at();

-- 4) TABLA project_role_skills -----------------------------------------------
-- Habilidades que exige cada rol. Relación N:N entre roles y el catálogo skills.
-- unique(project_role_id, skill_id) evita repetir una habilidad en el mismo rol.
-- skill_id usa RESTRICT: no se borra una habilidad del catálogo que esté en uso.
create table public.project_role_skills (
  id              uuid primary key default gen_random_uuid(),
  project_role_id uuid not null references public.project_roles (id) on delete cascade,
  skill_id        uuid not null references public.skills (id) on delete restrict,
  nivel_minimo    skill_level,
  created_at      timestamptz not null default now(),
  unique (project_role_id, skill_id)
);

create index project_role_skills_role_id_idx on public.project_role_skills (project_role_id);

-- 5) FUNCIONES HELPER de permisos --------------------------------------------
-- Encapsulan la comprobación de "dueño" para no repetir subconsultas en cada
-- política. Se definen aquí (no al inicio) porque una función 'language sql' se
-- valida contra las tablas existentes al crearse: necesita que ya existan.
-- 'security definer' hace que corran saltando la RLS de las tablas que
-- consultan: así se evita la recursión (una política sobre projects que
-- consultara projects volvería a dispararse sola).

-- ¿El usuario autenticado es dueño de esta organización?
create or replace function public.owns_org(_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organizations o
    where o.id = _org_id and o.owner_id = auth.uid()
  );
$$;

-- ¿El usuario autenticado gestiona este proyecto (es dueño de su organización)?
create or replace function public.can_manage_project(_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    join public.organizations o on o.id = p.org_id
    where p.id = _project_id and o.owner_id = auth.uid()
  );
$$;

-- 6) ROW LEVEL SECURITY ------------------------------------------------------
alter table public.organizations       enable row level security;
alter table public.projects            enable row level security;
alter table public.project_roles       enable row level security;
alter table public.project_role_skills enable row level security;

-- organizations: lectura pública (los proyectos publicados muestran su patrocinador).
create policy "organizations_select_all"
  on public.organizations for select
  using (true);

-- organizations: solo el dueño (o un admin) crea/edita/borra su organización.
create policy "organizations_insert_own"
  on public.organizations for insert
  with check (owner_id = auth.uid());

create policy "organizations_update_own"
  on public.organizations for update
  using (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  with check (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "organizations_delete_own"
  on public.organizations for delete
  using (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- projects: lectura de los publicados para todos; borradores solo para quien
-- gestiona el proyecto o un admin.
create policy "projects_select_published_or_manager"
  on public.projects for select
  using (
    status = 'publicado'
    or public.can_manage_project(id)
    or public.has_role(auth.uid(), 'admin')
  );

-- projects: se crea dentro de una organización propia, registrando al autor.
create policy "projects_insert_own_org"
  on public.projects for insert
  with check (created_by = auth.uid() and public.owns_org(org_id));

-- projects: edita/borra quien gestiona el proyecto (dueño de la org) o un admin.
create policy "projects_update_manager"
  on public.projects for update
  using (public.can_manage_project(id) or public.has_role(auth.uid(), 'admin'))
  with check (public.can_manage_project(id) or public.has_role(auth.uid(), 'admin'));

create policy "projects_delete_manager"
  on public.projects for delete
  using (public.can_manage_project(id) or public.has_role(auth.uid(), 'admin'));

-- project_roles: visibles si el proyecto padre es visible; escritura solo del gestor.
create policy "project_roles_select_if_project_visible"
  on public.project_roles for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_roles.project_id
        and (p.status = 'publicado' or public.can_manage_project(p.id))
    )
    or public.has_role(auth.uid(), 'admin')
  );

create policy "project_roles_write_manager"
  on public.project_roles for all
  using (public.can_manage_project(project_id) or public.has_role(auth.uid(), 'admin'))
  with check (public.can_manage_project(project_id) or public.has_role(auth.uid(), 'admin'));

-- project_role_skills: mismas reglas, resueltas a través del rol → proyecto.
create policy "project_role_skills_select_if_project_visible"
  on public.project_role_skills for select
  using (
    exists (
      select 1
      from public.project_roles r
      join public.projects p on p.id = r.project_id
      where r.id = project_role_skills.project_role_id
        and (p.status = 'publicado' or public.can_manage_project(p.id))
    )
    or public.has_role(auth.uid(), 'admin')
  );

create policy "project_role_skills_write_manager"
  on public.project_role_skills for all
  using (
    public.has_role(auth.uid(), 'admin')
    or exists (
      select 1 from public.project_roles r
      where r.id = project_role_skills.project_role_id
        and public.can_manage_project(r.project_id)
    )
  )
  with check (
    public.has_role(auth.uid(), 'admin')
    or exists (
      select 1 from public.project_roles r
      where r.id = project_role_skills.project_role_id
        and public.can_manage_project(r.project_id)
    )
  );
