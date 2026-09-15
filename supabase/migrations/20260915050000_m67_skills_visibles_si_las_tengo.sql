-- ============================================================================
-- M67 · Una habilidad inactiva no debería desaparecer del propio perfil
--
-- `skills_select_active_or_admin` (M2) solo dejaba ver una habilidad si está
-- `activo = true` o quien consulta es admin. Si un admin desactiva una
-- habilidad desde /admin/catalogos (D-02), cualquier estudiante que ya la
-- tuviera cargada en `profile_skills` deja de poder ver su propio nombre —
-- la fila de `profile_skills` sigue existiendo, pero el `join` a `skills`
-- para mostrar el nombre no encuentra nada visible. Mismo patrón que
-- `shares_team_with`/`manages_applicant` (M13/M14): una función
-- `security definer` que compara contra `auth.uid()`, sumada como condición
-- extra a la policy existente en vez de reemplazarla.
-- ============================================================================

create or replace function public.has_own_skill(_skill_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profile_skills ps
    where ps.skill_id = _skill_id and ps.profile_id = auth.uid()
  );
$$;

drop policy "skills_select_active_or_admin" on public.skills;

create policy "skills_select_active_or_admin"
  on public.skills for select
  using (
    activo = true
    or public.has_role(auth.uid(), 'admin')
    or public.has_own_skill(id)
  );
