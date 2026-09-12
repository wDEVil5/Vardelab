-- ============================================================================
-- M30 · Mensajería básica por proyecto
--
-- El Figma de seguimiento de hitos (S-05) incluye un botón "Enviar mensaje"
-- para que el patrocinador se comunique con el equipo. No existía ninguna
-- forma de mensajería en la app; se agrega la versión más simple posible: un
-- solo hilo por proyecto (no conversaciones 1:1 ni por hito), visible para
-- quien gestiona el proyecto y para los integrantes de su equipo.
-- ============================================================================

create table public.project_messages (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  -- SET NULL conserva el mensaje aunque se elimine la cuenta del autor (mismo
  -- criterio que `submissions.submitted_by`).
  sender_id   uuid references auth.users (id) on delete set null,
  body        text not null,
  created_at  timestamptz not null default now(),
  constraint project_messages_body_len check (char_length(body) between 1 and 2000)
);

create index project_messages_project_id_idx on public.project_messages (project_id, created_at);

alter table public.project_messages enable row level security;

-- Lectura: quien gestiona el proyecto o integra su equipo (o un admin).
create policy "project_messages_select_participant"
  on public.project_messages for select
  using (
    public.can_manage_project(project_id)
    or public.is_project_member(project_id)
    or public.has_role(auth.uid(), 'admin')
  );

-- Escritura: mismo criterio, y solo en nombre propio.
create policy "project_messages_insert_participant"
  on public.project_messages for insert
  with check (
    sender_id = auth.uid()
    and (public.can_manage_project(project_id) or public.is_project_member(project_id))
  );
