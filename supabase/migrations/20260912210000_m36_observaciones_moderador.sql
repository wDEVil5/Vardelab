-- ============================================================================
-- M36 · Observaciones del moderador (S-07)
--
-- Hasta ahora el rechazo de un proyecto era un solo comentario de texto libre
-- (`comentario_moderacion`, M21) y no existía ningún registro estructurado por
-- ítem, ni una forma de que el patrocinador dejara constancia de qué cambió
-- antes de reenviar. `comentario_moderacion` se mantiene como el resumen
-- general (lo que ya se muestra hoy); esta migración agrega el detalle por
-- observación puntual (categoría + texto + si el patrocinador la marcó como
-- resuelta) y un campo para la respuesta del patrocinador al reenviar.
--
-- Ciclo de vida: el moderador crea las observaciones al rechazar (junto con el
-- comentario general); el patrocinador las marca resueltas y escribe su
-- respuesta antes de reenviar a revisión — todo eso queda visible para el
-- moderador mientras el proyecto está de nuevo `en_revision` (no se borra al
-- reenviar, a diferencia de antes). Recién se limpia cuando el moderador toma
-- una nueva decisión: al aprobar desaparece todo; al rechazar de nuevo se
-- reemplaza por el nuevo comentario y las nuevas observaciones.
-- ============================================================================

alter table public.projects add column respuesta_patrocinador text;

create table public.project_observations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  categoria text not null,
  texto text not null,
  resuelta boolean not null default false,
  created_at timestamptz not null default now()
);

create index project_observations_project_id_idx on public.project_observations(project_id);

alter table public.project_observations enable row level security;

-- El gestor del proyecto (para leer y marcar resueltas) y moderador/admin
-- (para crearlas, leerlas y limpiarlas en la próxima decisión).
create policy "project_observations_select_manager_or_moderator"
  on public.project_observations for select
  using (
    public.can_manage_project(project_id)
    or public.has_role(auth.uid(), 'moderador'::app_role)
    or public.has_role(auth.uid(), 'admin'::app_role)
  );

create policy "project_observations_insert_moderator"
  on public.project_observations for insert
  with check (
    public.has_role(auth.uid(), 'moderador'::app_role)
    or public.has_role(auth.uid(), 'admin'::app_role)
  );

-- El gestor solo necesita marcar/desmarcar `resuelta` desde su pantalla; el
-- moderador no edita observaciones existentes (las reemplaza al decidir de
-- nuevo), pero se le deja la misma puerta por si hace falta corregir una.
create policy "project_observations_update_manager_or_moderator"
  on public.project_observations for update
  using (
    public.can_manage_project(project_id)
    or public.has_role(auth.uid(), 'moderador'::app_role)
    or public.has_role(auth.uid(), 'admin'::app_role)
  )
  with check (
    public.can_manage_project(project_id)
    or public.has_role(auth.uid(), 'moderador'::app_role)
    or public.has_role(auth.uid(), 'admin'::app_role)
  );

create policy "project_observations_delete_moderator"
  on public.project_observations for delete
  using (
    public.has_role(auth.uid(), 'moderador'::app_role)
    or public.has_role(auth.uid(), 'admin'::app_role)
  );
