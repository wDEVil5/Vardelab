-- ============================================================================
-- M86 · Revoca la lectura pública de teams/team_members (M27)
--
-- La ficha pública de un proyecto (/proyectos/[id]) dejó de mostrar los
-- nombres de quién integra el equipo: al recorrer el catálogo se podía notar
-- que una misma persona quedaba seleccionada en varios proyectos, algo que
-- puede sentirse injusto para quien postuló a alguno de ellos y no quedó.
-- Ahora esa ficha solo muestra el estado por rol (cubierto o no), que ya sale
-- de `project_roles` (M3), público desde siempre.
--
-- Sin este cambio, las políticas públicas de M27 seguían dejando leer
-- `teams`/`team_members` directo por API (con la anon key, sin pasar por la
-- app) y cruzarlas con `profiles` para reconstruir el mismo patrón que se
-- sacó de la UI. Se revoca el acceso público; se mantiene el de
-- integrante/gestor/admin (M4).
-- ============================================================================

drop policy if exists "teams_select_public" on public.teams;
drop policy if exists "team_members_select_public" on public.team_members;
