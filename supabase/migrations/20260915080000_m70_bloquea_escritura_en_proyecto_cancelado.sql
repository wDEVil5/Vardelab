-- ============================================================================
-- M70 · Un proyecto cancelado/completado seguía aceptando hitos y entregas
--
-- Cancelar un proyecto (M60) no bloquea ninguna escritura relacionada:
-- `milestones_write_manager` y `submissions_insert_member` (ambas de M5) solo
-- verifican quién puede escribir (gestor o integrante del equipo), nunca el
-- estado del proyecto. El gestor podía seguir creando/editando hitos y un
-- integrante del equipo seguir entregando avances en un proyecto ya cerrado —
-- mismo patrón raíz ya corregido en las consultas de "próximos hitos" y
-- "postulaciones por revisar" (M68/queries), ahora en el borde de escritura.
-- ============================================================================

drop policy "milestones_write_manager" on public.milestones;

create policy "milestones_write_manager"
  on public.milestones for all
  using (
    public.can_manage_project(project_id)
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.status not in ('cancelado', 'completado')
    )
    or public.has_role(auth.uid(), 'admin')
  )
  with check (
    public.can_manage_project(project_id)
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.status not in ('cancelado', 'completado')
    )
    or public.has_role(auth.uid(), 'admin')
  );

drop policy "submissions_insert_member" on public.submissions;

create policy "submissions_insert_member"
  on public.submissions for insert
  with check (
    submitted_by = auth.uid()
    and exists (
      select 1 from public.milestones m
      join public.projects p on p.id = m.project_id
      where m.id = milestone_id
        and public.is_project_member(m.project_id)
        and p.status not in ('cancelado', 'completado')
    )
  );
