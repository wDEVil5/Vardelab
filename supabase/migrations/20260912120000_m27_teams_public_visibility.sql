-- ============================================================================
-- M27 · El público puede ver el equipo de un proyecto publicado
--
-- La ficha pública de un proyecto (/proyectos/[id]) no podía mostrar quién
-- forma el equipo una vez que se seleccionan los estudiantes: no había
-- ninguna política de lectura en `teams`/`team_members` fuera de
-- integrante/gestor/admin (M4). Se agrega lectura pública, en espejo de
-- `projects_select_published_or_manager` (M3): el equipo de un proyecto es
-- visible si el proyecto mismo lo es. No hace falta tocar la RLS de
-- `profiles`: un integrante con perfil privado ya no se puede ver por ningún
-- otro camino (M1), así que tampoco se expone aquí — la consulta de la app
-- lo trata igual que a cualquier perfil sin nombre visible.
-- ============================================================================

create policy "teams_select_public"
  on public.teams for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = teams.project_id and p.status = 'publicado'
    )
  );

create policy "team_members_select_public"
  on public.team_members for select
  using (
    exists (
      select 1 from public.teams t
      join public.projects p on p.id = t.project_id
      where t.id = team_members.team_id and p.status = 'publicado'
    )
  );
