-- ============================================================================
-- M79 · Paginación real de /admin/proyectos
--
-- Mismo anti-patrón que el catálogo público antes de M78: `getProjectsForAdmin`
-- traía TODOS los proyectos (sin límite) y `ProjectsTable` los filtraba/
-- renderizaba enteros en el cliente. Con el volumen de la prueba de carga
-- (~6.000 proyectos) la tabla se vuelve una lista interminable.
--
-- A diferencia del catálogo público, acá el filtro es simple (título del
-- proyecto O nombre de la organización, más el estado exacto) — no hace
-- falta `unaccent` ni el chequeo de habilidades. `security invoker`: la RLS
-- de `projects`/`organizations` sigue aplicando tal cual (el admin ya tiene
-- acceso completo vía `has_role(auth.uid(),'admin')` en la policy de
-- selección de M3/M77).
-- ============================================================================

create or replace function public.admin_projects_page(
  _q text default null,
  _status text default null,
  _limit int default 20,
  _offset int default 0
)
returns table (id uuid, total_count bigint)
language sql
stable
as $$
  select p.id, count(*) over () as total_count
  from public.projects p
  left join public.organizations o on o.id = p.org_id
  where (_status is null or _status = '' or p.status = _status::project_status)
    and (
      _q is null or btrim(_q) = ''
      or p.titulo ilike (
        '%' || replace(replace(replace(_q, '\', '\\'), '%', '\%'), '_', '\_') || '%'
      )
      or o.nombre ilike (
        '%' || replace(replace(replace(_q, '\', '\\'), '%', '\%'), '_', '\_') || '%'
      )
    )
  order by p.created_at desc
  limit _limit offset _offset;
$$;
