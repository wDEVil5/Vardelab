-- ============================================================================
-- M114 · "% de participantes activos con evidencia" (PRD §3.5, REGLAS_NEGOCIO.md)
--
-- La métrica del PRD §3.5 ("más del 60% de participantes activos tenga
-- evidencia de portafolio utilizable") seguía sin construirse: faltaba
-- definir "participante activo" y "evidencia utilizable". Decisión del
-- dueño del piloto (2026-11-10, D8 — ver REGLAS_NEGOCIO.md):
--   - Participante activo: quien integra o integró un equipo
--     (`team_members.user_id`). Aceptar una postulación siempre crea esa
--     fila (`accept_application`, M84) en la misma transacción, así que es
--     la fuente directa de "ya fue seleccionado, el proyecto se activó".
--   - Evidencia utilizable (por ahora): cualquier ficha de portafolio
--     pública suya (`portfolio_items.visibility = 'publico'`), con o sin
--     proyecto ligado — la pregunta es "¿tiene algo que mostrar?", no si
--     esa ficha pasa el criterio estricto de "evidenciasPortafolio" (M104:
--     pública + ligada a un proyecto con autorización de divulgación).
--     Shortcut: cuenta evidencia pública aunque no esté ligada a un
--     proyecto con autorización — si eso infla el número de forma notoria,
--     pasar este criterio al mismo filtro estricto de M104 (ver nota en
--     BACKEND.md).
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
  _participantes record;
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'No autorizado.';
  end if;

  select count(*) as total, count(*) filter (where status = 'aceptada') as aceptadas
    into _postulaciones from public.applications;

  select count(*) as total, count(*) filter (where estado = 'aprobado') as aprobados
    into _hitos from public.milestones;

  select count(*) filter (where status <> 'resuelto') as abiertos,
         count(*) filter (where status = 'resuelto') as resueltos
    into _reportes from public.reports;

  select count(distinct tm.user_id) as activos,
         count(distinct tm.user_id) filter (
           where exists (
             select 1 from public.portfolio_items pi
             where pi.profile_id = tm.user_id and pi.visibility = 'publico'
           )
         ) as con_evidencia
    into _participantes
    from public.team_members tm;

  select jsonb_build_object(
    'porEstado', (
      select coalesce(jsonb_object_agg(status, cnt), '{}'::jsonb)
      from (select status, count(*) as cnt from public.projects group by status) s
    ),
    'totalProyectos', (select count(*) from public.projects),
    'equiposFormados', (select count(*) from public.teams),
    -- Solo pública, ligada a un proyecto real, con divulgación autorizada por
    -- su gestor (M102) — no cualquier fila de `portfolio_items`.
    'evidenciasPortafolio', (
      select count(*)
      from public.portfolio_items pi
      join public.projects p on p.id = pi.project_id
      where pi.visibility = 'publico' and p.autoriza_divulgacion
    ),
    'postulaciones', jsonb_build_object(
      'total', _postulaciones.total, 'aceptadas', _postulaciones.aceptadas
    ),
    'hitos', jsonb_build_object(
      'total', _hitos.total, 'aprobados', _hitos.aprobados
    ),
    'reportes', jsonb_build_object(
      'abiertos', _reportes.abiertos, 'resueltos', _reportes.resueltos
    ),
    'participantes', jsonb_build_object(
      'activos', _participantes.activos, 'conEvidencia', _participantes.con_evidencia
    )
  ) into _result;

  return _result;
end;
$$;
