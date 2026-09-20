-- ============================================================================
-- M96 · Cierra el oráculo de enumeración de correos en find_user_id_by_email
--
-- Hallazgo de la auditoría de seguridad: M82/M85 ya revocaron el acceso
-- directo por RPC a `anon`/`PUBLIC`, pero `authenticated` sigue teniendo
-- `execute` (otorgado en bloque por M10 a todas las funciones de `public`).
-- Eso significa que cualquier usuario con sesión — un estudiante, no solo
-- quien gestiona una organización — puede llamar
-- `supabase.rpc('find_user_id_by_email', { _email: 'x@y.cl' })` directo,
-- sin pasar por `inviteOrganizationMember`, y usarlo para confirmar si un
-- correo tiene cuenta y obtener su uuid real.
--
-- El único llamador legítimo (`inviteOrganizationMember`,
-- features/organizations/actions.ts) solo lo necesita para invitar a una
-- organización que el propio llamador gestiona. El fix real no es revocar
-- `authenticated` (perdería el caso de uso legítimo), sino agregar la misma
-- validación de propósito que ya le falta a la función: solo devuelve un
-- resultado si quien llama gestiona AL MENOS UNA organización (dueño o
-- miembro activo, mismo criterio que `is_org_member`, M37, pero sin acotar
-- a un `_org_id` puntual). Para cualquier otro usuario autenticado, la
-- función siempre devuelve null, sin importar el correo — cierra el oráculo
-- sin tocar el permiso de `authenticated`.
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
      exists (select 1 from public.organizations where owner_id = auth.uid())
      or exists (
        select 1 from public.organization_members
        where user_id = auth.uid() and status = 'activo'
      )
    )
  limit 1;
$$;
