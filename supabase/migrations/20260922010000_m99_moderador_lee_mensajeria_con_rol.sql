-- ============================================================================
-- M99 · El moderador puede leer la mensajería de un proyecto (RLS)
--
-- M30 dejó `project_messages_select_participant` con acceso solo para quien
-- gestiona el proyecto, integra su equipo, o es admin. El moderador quedaba
-- sin ninguna vía de acceso, ni siquiera ante un reporte real: no hay
-- política ni función que le dé lectura a esta tabla hoy.
--
-- Este cambio es solo la base en RLS: le da a 'moderador' el mismo bypass de
-- lectura que ya tiene 'admin'. El botón para abrir la conversación desde un
-- reporte puntual (UI) y el registro en audit_logs de cada apertura quedan
-- para una rama aparte — a propósito, el usuario pidió separar la UI de
-- este cambio de base de datos.
-- ============================================================================

drop policy "project_messages_select_participant" on public.project_messages;

create policy "project_messages_select_participant"
  on public.project_messages for select
  using (
    public.can_manage_project(project_id)
    or public.is_project_member(project_id)
    or public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'moderador')
  );
