-- ============================================================================
-- M6 · Reputación y portafolio:
--   evaluations     → evaluación de un integrante dentro de un proyecto
--   portfolio_items → evidencias de portafolio del estudiante
-- ============================================================================

-- 1) TABLA evaluations -------------------------------------------------------
-- Evaluación de un integrante (evaluatee) por el gestor/mentor (evaluator).
-- puntaje 1..5 lo garantiza el CHECK (nullable: puede haber devolución sin nota).
-- unique(project_id, evaluatee_id, evaluator_id): una evaluación por par y proyecto.
-- evaluatee_id CASCADE (la evaluación no vive sin el evaluado); evaluator_id
-- SET NULL (se conserva la evaluación aunque se elimine la cuenta evaluadora).
create table public.evaluations (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  evaluatee_id uuid not null references auth.users (id) on delete cascade,
  evaluator_id uuid references auth.users (id) on delete set null,
  puntaje      int check (puntaje between 1 and 5),
  comentario   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (project_id, evaluatee_id, evaluator_id)
);

create index evaluations_project_id_idx   on public.evaluations (project_id);
create index evaluations_evaluatee_id_idx on public.evaluations (evaluatee_id);

create trigger evaluations_set_updated_at
  before update on public.evaluations
  for each row execute function public.set_updated_at();

-- 2) TABLA portfolio_items ---------------------------------------------------
-- Evidencias que el estudiante arma en su portafolio. project_id es opcional
-- (SET NULL) para enlazar la evidencia a un proyecto sin depender de él.
-- No guarda puntaje: la reputación numérica no se publica (PRD §14.2).
create table public.portfolio_items (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  project_id  uuid references public.projects (id) on delete set null,
  titulo      text not null,
  descripcion text,
  url         text,
  visibility  visibility not null default 'privado',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index portfolio_items_profile_id_idx on public.portfolio_items (profile_id);

create trigger portfolio_items_set_updated_at
  before update on public.portfolio_items
  for each row execute function public.set_updated_at();

-- 3) ROW LEVEL SECURITY ------------------------------------------------------
alter table public.evaluations     enable row level security;
alter table public.portfolio_items enable row level security;

-- evaluations: dato sensible. La ve el evaluado, el evaluador, el gestor del
-- proyecto y un admin. No es pública.
create policy "evaluations_select_involved_or_manager"
  on public.evaluations for select
  using (
    evaluatee_id = auth.uid()
    or evaluator_id = auth.uid()
    or public.can_manage_project(project_id)
    or public.has_role(auth.uid(), 'admin')
  );

-- evaluations: la registra quien gestiona el proyecto, a nombre propio como
-- evaluador. (El rol mentor se integra en el hito de Auth.)
create policy "evaluations_insert_manager"
  on public.evaluations for insert
  with check (
    evaluator_id = auth.uid()
    and (public.can_manage_project(project_id) or public.has_role(auth.uid(), 'admin'))
  );

-- evaluations: modifica/borra el evaluador o el gestor del proyecto (o un admin).
create policy "evaluations_update_evaluator_or_manager"
  on public.evaluations for update
  using (
    evaluator_id = auth.uid()
    or public.can_manage_project(project_id)
    or public.has_role(auth.uid(), 'admin')
  )
  with check (
    evaluator_id = auth.uid()
    or public.can_manage_project(project_id)
    or public.has_role(auth.uid(), 'admin')
  );

create policy "evaluations_delete_evaluator_or_manager"
  on public.evaluations for delete
  using (
    evaluator_id = auth.uid()
    or public.can_manage_project(project_id)
    or public.has_role(auth.uid(), 'admin')
  );

-- portfolio_items: lectura pública solo de las marcadas 'publico'; el dueño ve
-- las suyas (públicas o privadas); un admin ve todo.
create policy "portfolio_items_select_public_or_own"
  on public.portfolio_items for select
  using (
    visibility = 'publico'
    or profile_id = auth.uid()
    or public.has_role(auth.uid(), 'admin')
  );

-- portfolio_items: cada usuario gestiona solo su propio portafolio.
create policy "portfolio_items_write_own"
  on public.portfolio_items for all
  using (profile_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  with check (profile_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
