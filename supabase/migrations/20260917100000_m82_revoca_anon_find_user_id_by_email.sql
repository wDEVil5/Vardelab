-- ============================================================================
-- M82 · Revoca el acceso anónimo a find_user_id_by_email
--
-- Hallazgo de la auditoría de seguridad: M10 (api_grants) otorga `execute` en
-- TODAS las funciones de `public` a `anon` y `authenticated` por igual. Para
-- la mayoría de las funciones eso es inofensivo (son `security invoker` o
-- ya revalidan `auth.uid()` internamente), pero `find_user_id_by_email`
-- (M37) es `security definer` y no valida quién llama — un cliente sin
-- sesión puede invocarla vía RPC directo y usarla como oráculo de
-- enumeración de correos (confirma si un email tiene cuenta y expone su
-- uuid). El único llamador real es `inviteOrganizationMember`
-- (features/organizations/actions.ts), que siempre corre con una sesión
-- autenticada — no necesita acceso `anon`.
-- ============================================================================

revoke execute on function public.find_user_id_by_email(text) from anon;
