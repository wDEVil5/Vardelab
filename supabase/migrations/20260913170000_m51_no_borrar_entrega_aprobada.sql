-- ============================================================================
-- M51 · No se puede borrar una entrega de un hito ya aprobado
--
-- Al revisar la pantalla de un hito completado (después de M50) se encontró
-- que el botón de borrar una entrega seguía visible ahí — el propio autor
-- podía eliminar la evidencia de algo que el gestor ya aprobó, sin que nada
-- del lado del servidor lo impidiera (la RLS solo miraba "sos el autor",
-- nunca el estado del hito). Se ocultó el botón en la interfaz, pero la
-- barrera real tiene que estar acá: la política de borrado.
--
-- El gestor mantiene su permiso de borrar sin esta restricción (puede
-- necesitar corregir una aprobación equivocada); solo se acota el camino del
-- propio autor.
-- ============================================================================

drop policy "submissions_delete_author_or_manager" on public.submissions;

create policy "submissions_delete_author_or_manager"
  on public.submissions for delete
  using (
    (
      submitted_by = auth.uid()
      and exists (
        select 1 from public.milestones m
        where m.id = submissions.milestone_id and m.estado <> 'aprobado'
      )
    )
    or public.has_role(auth.uid(), 'admin'::app_role)
    or exists (
      select 1 from public.milestones m
      where m.id = submissions.milestone_id and public.can_manage_project(m.project_id)
    )
  );
