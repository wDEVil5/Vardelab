-- ============================================================================
-- M15 · Un integrante puede ver el roster de su equipo
-- Completa lo que M14 empezó (perfiles de compañeros): la política de M4
-- `team_members_select_self_or_manager` solo deja ver la PROPIA fila, así que un
-- estudiante no puede listar a sus compañeros. Se agrega una política SELECT
-- permisiva (OR con la existente): si el usuario es miembro del equipo, ve todas
-- las filas de ese equipo. Se apoya en `is_team_member` (security definer, M4),
-- que evita recursión de RLS.
-- ============================================================================

create policy "team_members_select_teammate"
  on public.team_members for select
  using (public.is_team_member(team_id));
