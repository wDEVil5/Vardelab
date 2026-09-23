-- ============================================================================
-- M101 · `find_user_id_by_email` no dejaba pasar a `service_role`
--
-- Bug real encontrado al usar `scripts/bootstrap-admin.mjs` en producción: el
-- guard de M96 (auth.uid() gestiona alguna organización) asume que quien
-- llama tiene una sesión de usuario. Con la `service_role` key no hay JWT de
-- usuario — `auth.uid()` es `null` — así que las dos condiciones `exists(...)`
-- son siempre falsas y la función devuelve `null` sin importar el correo,
-- aunque la cuenta exista. Reproducido en local: la misma llamada con
-- `service_role` contra `estudiante@demo.cl` (usuario real del seed) también
-- devolvía `null`.
--
-- Fix: agrega la excepción explícita para `service_role` — el único otro rol
-- con permiso de ejecutar esta función (M82/M85 ya revocaron `anon`/PUBLIC),
-- y el caso de uso real de `bootstrap-admin.mjs` (bootstrear el primer admin,
-- donde por definición todavía no hay ningún admin logueado que pudiera
-- llamarla como usuario autenticado).
-- ============================================================================

create or replace function public.find_user_id_by_email(_email text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from auth.users
  where lower(email) = lower(_email)
    and (
      auth.role() = 'service_role'
      or exists (select 1 from public.organizations where owner_id = auth.uid())
      or exists (
        select 1 from public.organization_members
        where user_id = auth.uid() and status = 'activo'
      )
    )
  limit 1;
$$;
