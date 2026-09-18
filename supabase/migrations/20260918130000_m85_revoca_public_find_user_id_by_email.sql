-- ============================================================================
-- M85 · Cierra de verdad el acceso anónimo a find_user_id_by_email
--
-- Hallazgo real al escribir las pruebas de RLS contra las funciones
-- `security definer` (tests/rls/security-definer.test.mjs): la revocación de
-- M82 ("revoca_anon_find_user_id_by_email") no cerraba nada en la práctica.
-- Postgres otorga `EXECUTE` a `PUBLIC` (todos los roles, sin excepción) por
-- defecto al crear cualquier función, salvo que se revoque explícitamente.
-- M82 solo hizo `revoke ... from anon` — el rol `anon` seguía pudiendo
-- ejecutar la función igual, heredando el permiso de `PUBLIC`, que nunca se
-- tocó. Confirmado a mano: `anon` conseguía el uuid real de un correo con
-- una llamada RPC directa, sin sesión.
--
-- El fix real es revocar de `PUBLIC` (no de `anon`): eso sí cierra el
-- permiso por defecto para cualquier rol, y de ahí en más solo lo tiene
-- quien lo tenga explícitamente otorgado (`authenticated`, ya otorgado por
-- M10 y sin tocar acá).
-- ============================================================================

revoke execute on function public.find_user_id_by_email(text) from public;
