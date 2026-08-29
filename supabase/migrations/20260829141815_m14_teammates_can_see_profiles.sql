-- ============================================================================
-- M14 · Los integrantes de un equipo pueden ver sus perfiles entre sí
-- Los perfiles nacen 'privado' (M1). El gestor ya ve a sus postulantes (M13),
-- pero un estudiante no puede ver a sus compañeros de equipo (perfiles ajenos
-- privados). Al formar equipo, tiene sentido que los integrantes se conozcan.
-- Se agrega una política SELECT permisiva (OR con las existentes) apoyada en una
-- función security definer, siguiendo el patrón de manages_applicant (M13).
-- ============================================================================

-- ¿El usuario actual comparte algún equipo con _other?
create or replace function public.shares_team_with(_other uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members me
    join public.team_members other on other.team_id = me.team_id
    where me.user_id = auth.uid()
      and other.user_id = _other
  );
$$;

-- profiles: además de público/propio (M1) y postulante-a-mi-proyecto (M13), lo
-- ve quien comparte equipo con esa persona.
create policy "profiles_select_teammate"
  on public.profiles for select
  using (public.shares_team_with(id));
