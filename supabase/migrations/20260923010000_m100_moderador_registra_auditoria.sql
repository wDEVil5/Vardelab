-- ============================================================================
-- M100 · El moderador puede escribir en audit_logs (solo para su propio
-- evento de "abrió una conversación")
--
-- Segundo tramo de "supervisión de mensajería" (M99 dio la lectura de
-- project_messages). El acceso a un hilo de mensajes desde un reporte queda
-- gateado y con rastro (mismo criterio ya usado con la industria: acceso
-- reactivo, auditado) — pero `audit_logs_insert_admin` (M7) solo dejaba
-- insertar a un admin. Sin este cambio, la Server Action que registra
-- "moderador abrió esta conversación" fallaría por RLS para cualquier
-- moderador que no sea también admin.
-- ============================================================================

drop policy "audit_logs_insert_admin" on public.audit_logs;

create policy "audit_logs_insert_admin_o_moderador"
  on public.audit_logs for insert
  with check (
    public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'moderador')
  );
