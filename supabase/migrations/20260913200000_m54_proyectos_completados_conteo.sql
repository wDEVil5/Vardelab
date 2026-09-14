-- ============================================================================
-- M54 · Conteo de proyectos completados, para el perfil público (E-08)
--
-- El perfil público de un estudiante quería mostrar "N proyectos completados"
-- como resumen rápido para quien lo visita, pero la RLS de `projects`
-- (`projects_select_published_or_manager`) solo deja ver proyectos en estado
-- 'publicado' o 'seleccion' a cualquiera que no sea quien lo gestiona — un
-- proyecto 'completado' es invisible para un visitante público, a propósito
-- (evita exponer el estado interno de proyectos cerrados). Por eso el conteo
-- no puede hacerse con una consulta normal desde el visitante: necesita una
-- función `security definer` que devuelva solo el número, sin exponer ningún
-- dato del proyecto en sí — mismo criterio que `org_recipient_ids` o
-- `shares_project_with`.
-- ============================================================================

create or replace function public.completed_projects_count(_profile_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct p.id)::int
  from team_members tm
  join teams t on t.id = tm.team_id
  join projects p on p.id = t.project_id
  where tm.user_id = _profile_id and p.status = 'completado';
$$;
