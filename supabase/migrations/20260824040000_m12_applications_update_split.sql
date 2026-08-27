-- ============================================================================
-- M12 · Endurecer el update de applications (autor solo puede retirar)
-- La política de M4 (applications_update_own_or_manager) juntaba autor y gestor
-- en una sola regla cuyo WITH CHECK permitía al autor fijar CUALQUIER estado
-- (podía auto-aceptarse). Se reemplaza por dos políticas permisivas (se combinan
-- con OR):
--   · gestor/admin  → puede cambiar a cualquier estado (aceptar/rechazar).
--   · autor         → su WITH CHECK solo admite status = 'retirada'.
-- Semántica en un UPDATE: la fila vieja debe cumplir algún USING y la fila nueva
-- debe cumplir algún WITH CHECK. Si el autor intenta 'aceptada', pasa el USING
-- (es su fila) pero ningún WITH CHECK lo aprueba → denegado. Retirar sí pasa.
-- ============================================================================

drop policy "applications_update_own_or_manager" on public.applications;

-- Gestor del proyecto (o admin): decide el estado de la postulación.
create policy "applications_update_manager"
  on public.applications for update
  using (
    public.can_manage_role(project_role_id)
    or public.has_role(auth.uid(), 'admin')
  )
  with check (
    public.can_manage_role(project_role_id)
    or public.has_role(auth.uid(), 'admin')
  );

-- Autor: solo puede retirar su propia postulación (no auto-aceptarse).
create policy "applications_withdraw_own"
  on public.applications for update
  using (applicant_id = auth.uid())
  with check (applicant_id = auth.uid() and status = 'retirada');
