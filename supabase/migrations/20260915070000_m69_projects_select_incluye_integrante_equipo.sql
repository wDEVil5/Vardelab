-- ============================================================================
-- M69 · Un integrante del equipo no podía ver su propio proyecto en 'activo'
--
-- Mismo bug que M32 encontró y corrigió en `milestones_select_if_project_visible`,
-- pero nunca se replicó en la política de la tabla padre `projects`. La política
-- vigente (M55) solo deja pasar 'publicado'/'seleccion'/'completado', o a quien
-- gestiona el proyecto (`can_manage_project`, solo cierto para la organización
-- dueña) o un admin — nunca por integrar el equipo.
--
-- Consecuencia real (reproducida en local): en cuanto el gestor confirma el
-- equipo y el proyecto pasa de 'seleccion' a 'activo' (la transición normal
-- para empezar a trabajar), la fila de `projects` deja de ser visible por RLS
-- para sus propios integrantes. `getMyTeams` (features/teams/queries.ts) hace
-- un embed `teams.select("... project:projects(...)")` sin `!inner`; al
-- bloquear RLS el embed, `project` llega null y `/proyecto/[projectId]`
-- responde 404 — el estudiante queda fuera de su propio espacio de trabajo
-- justo durante la fase en la que más lo necesita. Mismo hueco aplicaría a
-- 'revision_final' si ese estado llegara a usarse (hoy no es alcanzable).
-- ============================================================================

drop policy "projects_select_published_or_manager" on public.projects;

create policy "projects_select_published_or_manager"
  on public.projects for select
  using (
    status = any (array['publicado', 'seleccion', 'completado']::project_status[])
    or public.is_project_member(id)
    or can_manage_project(id)
    or has_role(auth.uid(), 'admin'::app_role)
  );
