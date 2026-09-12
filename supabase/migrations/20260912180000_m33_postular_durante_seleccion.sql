-- ============================================================================
-- M33 · Permitir postular mientras el proyecto está en selección
--
-- La RLS original (M4) solo dejaba postular a un proyecto 'publicado'. Desde
-- que M29 (esta misma sesión) agregó la transición automática publicado →
-- seleccion en cuanto llega la PRIMERA postulación, esa regla dejó de tener
-- sentido: bloqueaba a cualquier otro candidato — para ese rol o cualquier
-- otro rol del mismo proyecto, aunque quedaran cupos libres — apenas alguien
-- postulaba. La pantalla "Seleccionar equipo" (S-04) está pensada para
-- comparar varios candidatos; con esta regla nunca podía haber más de uno.
--
-- Ahora se puede postular con el proyecto en 'publicado' o 'seleccion'. Se
-- cierra de verdad recién en 'activo' (M31, al confirmar el equipo).
--
-- Esto no alcanza por sí solo: `projects_select_published_or_manager` (M3)
-- decide qué proyectos ve cualquiera que no lo gestiona, y solo dejaba ver los
-- 'publicado'. Sin ampliarla también, ni el catálogo ni la ficha del proyecto
-- ni la propia pantalla de postular pueden mostrar un proyecto en 'seleccion'
-- a un estudiante nuevo — la RLS de `projects` lo esconde antes de llegar a la
-- pregunta de si puede postular.
-- ============================================================================

drop policy "projects_select_published_or_manager" on public.projects;

create policy "projects_select_published_or_manager"
  on public.projects for select
  using (
    status in ('publicado', 'seleccion')
    or public.can_manage_project(id)
    or public.has_role(auth.uid(), 'admin')
  );

-- Mismo problema, un nivel más abajo: `project_roles_select_if_project_visible`
-- (M3) también solo dejaba ver los roles de un proyecto 'publicado'. La
-- policy de `applications_insert_own` hace un JOIN contra `project_roles`, así
-- que sin esto la fila del rol tampoco es visible durante la subconsulta y el
-- EXISTS da falso aunque el proyecto ya sea visible.
drop policy "project_roles_select_if_project_visible" on public.project_roles;

create policy "project_roles_select_if_project_visible"
  on public.project_roles for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_roles.project_id
        and (p.status in ('publicado', 'seleccion') or public.can_manage_project(p.id))
    )
    or public.has_role(auth.uid(), 'admin')
  );

-- Mismo problema, un nivel más abajo todavía: las habilidades exigidas por un
-- rol (`project_role_skills`) tampoco se veían fuera de 'publicado'. La
-- pantalla de postular (`getRoleForApplication`) las necesita para mostrar qué
-- pide el rol.
drop policy "project_role_skills_select_if_project_visible" on public.project_role_skills;

create policy "project_role_skills_select_if_project_visible"
  on public.project_role_skills for select
  using (
    exists (
      select 1
      from public.project_roles r
      join public.projects p on p.id = r.project_id
      where r.id = project_role_skills.project_role_id
        and (p.status in ('publicado', 'seleccion') or public.can_manage_project(p.id))
    )
    or public.has_role(auth.uid(), 'admin')
  );

-- Mismo problema en `teams`/`team_members` (M27): la lectura pública del
-- equipo en la ficha del proyecto también quedaba atada solo a 'publicado'.
drop policy "teams_select_public" on public.teams;

create policy "teams_select_public"
  on public.teams for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = teams.project_id and p.status in ('publicado', 'seleccion', 'activo', 'completado')
    )
  );

drop policy "team_members_select_public" on public.team_members;

create policy "team_members_select_public"
  on public.team_members for select
  using (
    exists (
      select 1 from public.teams t
      join public.projects p on p.id = t.project_id
      where t.id = team_members.team_id
        and p.status in ('publicado', 'seleccion', 'activo', 'completado')
    )
  );

drop policy "applications_insert_own" on public.applications;

create policy "applications_insert_own"
  on public.applications for insert
  with check (
    applicant_id = auth.uid()
    and exists (
      select 1
      from public.project_roles r
      join public.projects p on p.id = r.project_id
      where r.id = project_role_id and p.status in ('publicado', 'seleccion')
    )
  );
