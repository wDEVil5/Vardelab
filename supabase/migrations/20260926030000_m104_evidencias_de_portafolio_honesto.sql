-- ============================================================================
-- M104 · "Evidencias de portafolio" contaba cualquier fila, autorizada o no
--
-- Hallazgo (auditoría de reglas de negocio, 2026-09-26): `evidenciasPortafolio`
-- en `get_pilot_metrics()` (M98) era un `count(*)` plano de `portfolio_items`
-- — incluía fichas privadas, sin enlace y sin proyecto asociado. El panel
-- admin mostraba ese número bajo el rótulo "Evidencias de portafolio" sin
-- ninguna aclaración, prometiendo más certeza de la que el conteo garantizaba.
--
-- Con M102 ya existe una columna real para distinguir "evidencia autorizada"
-- de "cualquier ficha": una evidencia pública, ligada a un proyecto, cuenta
-- solo si ese proyecto tiene `autoriza_divulgacion = true` (la RLS de M102 ya
-- exige esto para que la ficha exista en ese estado). Contar por esa
-- condición, en vez de todas las filas, es la aproximación más honesta
-- disponible hoy — sigue sin ser "evidencia verificada" en el sentido pleno
-- del PRD (participación real + resultado + permiso), pero ya no cuenta
-- fichas privadas ni sin proyecto como si fueran evidencia pública mostrable.
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
    )
  ) into _result;

  return _result;
end;
$$;
