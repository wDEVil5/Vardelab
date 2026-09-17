-- ============================================================================
-- M81 · Paginación real de la cola de moderación de proyectos
--
-- Mismo hallazgo que M79/M80: `getProjectsForReview` traía TODOS los
-- proyectos en revisión sin límite, y `ModerationQueueTable` buscaba/filtraba
-- en memoria sobre el arreglo completo, sin scroll acotado. La cola se drena
-- en operación normal, pero no tiene techo garantizado (un pico de
-- publicaciones podría acumular cientos de proyectos esperando revisión).
--
-- `security invoker`: la RLS de `projects` (`projects_select_moderator`,
-- M18) sigue aplicando tal cual — sigue exigiendo moderador/admin.
-- ============================================================================

create or replace function public.moderation_queue_page(
  _q text default null,
  _modalidad text default null,
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
  where p.status = 'en_revision'
    and (
      _modalidad is null or _modalidad = ''
      or p.modalidad = _modalidad::project_modality
    )
    and (
      _q is null or btrim(_q) = ''
      or p.titulo ilike (
        '%' || replace(replace(replace(_q, '\', '\\'), '%', '\%'), '_', '\_') || '%'
      )
      or o.nombre ilike (
        '%' || replace(replace(replace(_q, '\', '\\'), '%', '\%'), '_', '\_') || '%'
      )
    )
  order by p.created_at asc
  limit _limit offset _offset;
$$;

-- KPIs de la cola completa (pendientes / organizaciones distintas / cupos
-- esperando), independientes del filtro y la página actual de la tabla —
-- antes salían de recorrer en memoria TODOS los proyectos ya traídos.
create or replace function public.moderation_queue_stats()
returns table (pendientes bigint, organizaciones bigint, cupos_abiertos bigint)
language sql
stable
as $$
  select
    count(distinct p.id),
    count(distinct p.org_id),
    coalesce(sum(r.cupos), 0)
  from public.projects p
  left join public.project_roles r on r.project_id = p.id
  where p.status = 'en_revision';
$$;

-- ============================================================================
-- M81 (cont.) · Ídem para /moderacion/reportes ya resuelto en código
-- (features/reports/queries.ts: getReportsPage/getReportCountsByStatus usan
-- `.range()`/`.eq()` directo, sin necesitar una función SQL — un solo filtro
-- exacto sobre una tabla propia no lo justifica). Esta migración solo cubre
-- moderación de proyectos, que sí necesitaba búsqueda de texto + join.
-- ============================================================================
