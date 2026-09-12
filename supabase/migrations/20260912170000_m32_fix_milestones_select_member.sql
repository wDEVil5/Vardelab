-- ============================================================================
-- M32 · Arreglo: los integrantes del equipo no veían los hitos de su proyecto
--
-- `milestones_select_if_project_visible` (M5) solo dejaba ver los hitos si el
-- proyecto estaba 'publicado', si gestionabas el proyecto, o si eras admin —
-- nunca por integrar el equipo. Esto nunca se notó porque, hasta M29/M31 (esta
-- misma sesión), ningún proyecto salía nunca de 'publicado'. Al activar las
-- transiciones reales (publicado → selección → activo → completado), un
-- proyecto pasa a 'seleccion'/'activo' en cuanto tiene equipo — y desde ahí sus
-- propios integrantes dejaban de ver el plan de hitos (`/proyecto/[projectId]`)
-- y, en cascada, las entregas (`submissions_select_member_or_manager` depende
-- de poder leer el hito para resolver su EXISTS).
-- ============================================================================

drop policy "milestones_select_if_project_visible" on public.milestones;

create policy "milestones_select_if_project_visible"
  on public.milestones for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = milestones.project_id and p.status = 'publicado'
    )
    or public.is_project_member(project_id)
    or public.can_manage_project(project_id)
    or public.has_role(auth.uid(), 'admin')
  );
