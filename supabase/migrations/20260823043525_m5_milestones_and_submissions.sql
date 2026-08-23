-- ============================================================================
-- M5 · Entregas:
--   milestones  → hitos/entregables planificados de un proyecto
--   submissions → entregas del equipo contra un hito
-- ============================================================================

-- 1) TABLA milestones --------------------------------------------------------
-- Hitos del proyecto (ej. "MVP", "Entrega final"). 'orden' permite ordenarlos
-- en la vista. ON DELETE CASCADE: los hitos pertenecen al proyecto.
create table public.milestones (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  titulo       text not null,
  descripcion  text,
  fecha_limite date,
  orden        int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index milestones_project_id_idx on public.milestones (project_id);

create trigger milestones_set_updated_at
  before update on public.milestones
  for each row execute function public.set_updated_at();

-- 2) TABLA submissions -------------------------------------------------------
-- Entrega concreta contra un hito (un enlace y/o una nota). submitted_by usa
-- SET NULL para conservar la entrega aunque se elimine la cuenta del autor.
create table public.submissions (
  id           uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.milestones (id) on delete cascade,
  submitted_by uuid references auth.users (id) on delete set null,
  url          text,
  nota         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index submissions_milestone_id_idx on public.submissions (milestone_id);

create trigger submissions_set_updated_at
  before update on public.submissions
  for each row execute function public.set_updated_at();

-- 3) FUNCIÓN HELPER ----------------------------------------------------------
-- Se define después de las tablas que consulta (validación de 'language sql').
-- ¿El usuario integra el equipo de este proyecto? Resuelve team_members a través
-- del team del proyecto. 'security definer' salta la RLS de esas tablas.
create or replace function public.is_project_member(_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.teams t
    join public.team_members m on m.team_id = t.id
    where t.project_id = _project_id and m.user_id = auth.uid()
  );
$$;

-- 4) ROW LEVEL SECURITY ------------------------------------------------------
alter table public.milestones  enable row level security;
alter table public.submissions enable row level security;

-- milestones: visibles si el proyecto está publicado (el plan es parte de la
-- convocatoria), o para quien lo gestiona, o un admin.
create policy "milestones_select_if_project_visible"
  on public.milestones for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = milestones.project_id and p.status = 'publicado'
    )
    or public.can_manage_project(project_id)
    or public.has_role(auth.uid(), 'admin')
  );

-- milestones: define el plan quien gestiona el proyecto o un admin.
create policy "milestones_write_manager"
  on public.milestones for all
  using (public.can_manage_project(project_id) or public.has_role(auth.uid(), 'admin'))
  with check (public.can_manage_project(project_id) or public.has_role(auth.uid(), 'admin'));

-- submissions: son trabajo interno; las ven los integrantes del equipo, el
-- gestor del proyecto y un admin (no son públicas aunque el proyecto lo sea).
create policy "submissions_select_member_or_manager"
  on public.submissions for select
  using (
    public.has_role(auth.uid(), 'admin')
    or exists (
      select 1 from public.milestones m
      where m.id = submissions.milestone_id
        and (public.is_project_member(m.project_id) or public.can_manage_project(m.project_id))
    )
  );

-- submissions: entrega un integrante del equipo, a nombre propio.
create policy "submissions_insert_member"
  on public.submissions for insert
  with check (
    submitted_by = auth.uid()
    and exists (
      select 1 from public.milestones m
      where m.id = milestone_id and public.is_project_member(m.project_id)
    )
  );

-- submissions: modifica/borra el autor o el gestor del proyecto (o un admin).
create policy "submissions_update_author_or_manager"
  on public.submissions for update
  using (
    submitted_by = auth.uid()
    or public.has_role(auth.uid(), 'admin')
    or exists (
      select 1 from public.milestones m
      where m.id = submissions.milestone_id and public.can_manage_project(m.project_id)
    )
  )
  with check (
    submitted_by = auth.uid()
    or public.has_role(auth.uid(), 'admin')
    or exists (
      select 1 from public.milestones m
      where m.id = submissions.milestone_id and public.can_manage_project(m.project_id)
    )
  );

create policy "submissions_delete_author_or_manager"
  on public.submissions for delete
  using (
    submitted_by = auth.uid()
    or public.has_role(auth.uid(), 'admin')
    or exists (
      select 1 from public.milestones m
      where m.id = submissions.milestone_id and public.can_manage_project(m.project_id)
    )
  );
