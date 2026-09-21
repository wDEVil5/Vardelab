-- ============================================================================
-- M98 · Métricas del piloto agregadas en SQL, no en JS
--
-- `getPilotMetrics` (D-01) traía `projects.status`, `applications.status`,
-- `teams.id`, `milestones.estado`, `portfolio_items.id` y `reports.status`
-- completos —TODAS las filas de 6 tablas— y contaba filtrando arreglos en
-- memoria. El propio comentario del código ya lo marcaba como deuda: "a
-- escala de piloto es simple y suficiente; con volumen real esto pasaría a
-- una vista o función SQL" — mismo anti-patrón que tenía el catálogo público
-- antes de M78 (resuelto ahí tras una prueba de carga real).
--
-- `security definer` (no `security invoker`, a diferencia de M78): el panel
-- admin necesita el agregado COMPLETO de `teams`/`applications`/etc., no solo
-- lo que la RLS le dejaría ver a través de su propia sesión — hasta ahora
-- eso se resolvía con el cliente `service_role` desde TypeScript. La función
-- reautoriza adentro (`has_role admin`, mismo patrón que `set_user_role`,
-- M56) porque cualquier autenticado podría invocarla directo por `rpc()`; con
-- eso ya no hace falta `service_role` para esta consulta puntual — un
-- beneficio aparte de la agregación en sí.
-- ============================================================================

create or replace function public.get_pilot_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _result jsonb;
  _postulaciones record;
  _hitos record;
  _reportes record;
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'No autorizado.';
  end if;

  -- Un `count(*) filter (...)` por tabla en vez de dos consultas (total +
  -- filtrado): una sola pasada agrega ambos números.
  select count(*) as total, count(*) filter (where status = 'aceptada') as aceptadas
    into _postulaciones from public.applications;

  select count(*) as total, count(*) filter (where estado = 'aprobado') as aprobados
    into _hitos from public.milestones;

  select count(*) filter (where status <> 'resuelto') as abiertos,
         count(*) filter (where status = 'resuelto') as resueltos
    into _reportes from public.reports;

  select jsonb_build_object(
    'porEstado', (
      select coalesce(jsonb_object_agg(status, cnt), '{}'::jsonb)
      from (select status, count(*) as cnt from public.projects group by status) s
    ),
    'totalProyectos', (select count(*) from public.projects),
    'equiposFormados', (select count(*) from public.teams),
    'evidenciasPortafolio', (select count(*) from public.portfolio_items),
    'postulaciones', jsonb_build_object(
      'total', _postulaciones.total, 'aceptadas', _postulaciones.aceptadas
    ),
    'hitos', jsonb_build_object(
      'total', _hitos.total, 'aprobados', _hitos.aprobados
    ),
    'reportes', jsonb_build_object(
      'abiertos', _reportes.abiertos, 'resueltos', _reportes.resueltos
    )
  ) into _result;

  return _result;
end;
$$;
