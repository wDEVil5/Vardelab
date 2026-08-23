-- ============================================================================
-- M7 · Moderación y auditoría:
--   reports     → reportes de conducta/seguridad
--   audit_logs  → registro inmutable de acciones sensibles
-- Último bloque del modelo de datos (PRD §11).
-- ============================================================================

-- 1) TABLA reports -----------------------------------------------------------
-- Un usuario reporta una entidad (proyecto, perfil, postulación...). Se usa un
-- par (target_type, target_id) en vez de un FK fijo porque el reporte puede
-- apuntar a distintas tablas. status usa el enum report_status de M0.
-- reporter_id SET NULL: el reporte se conserva aunque se elimine quien reportó.
create table public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid references auth.users (id) on delete set null,
  target_type  text not null,
  target_id    uuid,
  motivo       text not null,
  descripcion  text,
  status       report_status not null default 'abierto',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index reports_status_idx on public.reports (status);

create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- 2) TABLA audit_logs --------------------------------------------------------
-- Registro de acciones sensibles (moderación, cambios de estado). Es inmutable:
-- no lleva updated_at ni políticas de UPDATE/DELETE (RLS deniega por defecto).
-- 'metadata' jsonb guarda contexto libre de cada acción.
create table public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references auth.users (id) on delete set null,
  accion     text not null,
  entidad    text,
  entidad_id uuid,
  metadata   jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entidad_idx on public.audit_logs (entidad, entidad_id);

-- 3) ROW LEVEL SECURITY ------------------------------------------------------
alter table public.reports    enable row level security;
alter table public.audit_logs enable row level security;

-- reports: quien reporta ve los suyos; moderadores y admins ven todos.
create policy "reports_select_own_or_moderator"
  on public.reports for select
  using (
    reporter_id = auth.uid()
    or public.has_role(auth.uid(), 'moderador')
    or public.has_role(auth.uid(), 'admin')
  );

-- reports: cualquier usuario autenticado puede reportar, a nombre propio.
create policy "reports_insert_own"
  on public.reports for insert
  with check (reporter_id = auth.uid());

-- reports: solo moderadores/admins cambian el estado o gestionan el reporte.
create policy "reports_update_moderator"
  on public.reports for update
  using (public.has_role(auth.uid(), 'moderador') or public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'moderador') or public.has_role(auth.uid(), 'admin'));

-- audit_logs: solo moderadores/admins pueden leer la bitácora.
create policy "audit_logs_select_moderator"
  on public.audit_logs for select
  using (public.has_role(auth.uid(), 'moderador') or public.has_role(auth.uid(), 'admin'));

-- audit_logs: la escritura se hace desde el servidor con la service_role key
-- (salta RLS) o vía funciones 'security definer'; no hay INSERT desde el cliente,
-- salvo un admin. Sin políticas de UPDATE/DELETE: la bitácora es inmutable.
create policy "audit_logs_insert_admin"
  on public.audit_logs for insert
  with check (public.has_role(auth.uid(), 'admin'));
