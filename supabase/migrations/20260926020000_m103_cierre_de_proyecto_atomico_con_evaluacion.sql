-- ============================================================================
-- M103 · Cerrar proyecto: atómico en la base, y exige evaluar a todo el
-- equipo activo (RF-09)
--
-- `closeProject` (features/projects/actions.ts) hacía 2 `update` separados
-- desde la app (aprobar el hito final, luego cerrar el proyecto) sin ninguna
-- transacción que los agrupe — si el segundo fallaba después del primero, el
-- hito quedaba `aprobado` con el proyecto todavía `activo`, un estado a medio
-- camino persistente. Tampoco consultaba `evaluations` en ningún punto, pese
-- a que RF-09 del PRD dice textualmente "el proyecto no se completa sin
-- entrega y evaluación mínima" — el propio `projects_guard_status` (M31/M60)
-- documenta que esa precondición de negocio "vive en la Server Action, no acá".
--
-- Decisión de producto (D3 de la auditoría, confirmada por el dueño): cerrar
-- exige evaluar a TODOS los integrantes que sigan activos en el equipo al
-- momento del cierre. No hay excepción automática de abandono: si alguien
-- dejó el proyecto, el gestor ya tiene un camino real para sacarlo del equipo
-- (M75/M76) antes de cerrar — forzar esa decisión explícita es preferible a
-- inventar un estado de "abandono" nuevo para el piloto.
--
-- Mismo patrón que `accept_application` (M84): una función `plpgsql`
-- `security definer` que reautoriza manualmente (salta la RLS) y agrupa todo
-- en una sola transacción implícita, devolviendo un código de texto para los
-- casos de negocio esperados y reservando `raise exception` solo para acceso
-- no autorizado.
-- ============================================================================

create or replace function public.close_project(_project_id uuid, _milestone_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  _proyecto_estado text;
  _milestone_estado text;
  _faltan_evaluaciones boolean;
  _filas int;
begin
  -- Reautorización manual: repite el mismo criterio que ya exigía la policy
  -- `projects_update_manager`.
  if not public.can_manage_project(_project_id) and not public.has_role(auth.uid(), 'admin') then
    raise exception 'No autorizado';
  end if;

  select status into _proyecto_estado from public.projects where id = _project_id;
  if _proyecto_estado is distinct from 'activo' then
    return 'no_activo';
  end if;

  select estado into _milestone_estado
  from public.milestones
  where id = _milestone_id and project_id = _project_id;

  if _milestone_estado is null or _milestone_estado not in ('entregado', 'aprobado') then
    return 'sin_hito_final';
  end if;

  -- ¿Falta evaluar a algún integrante que sigue activo en el equipo? Se
  -- acepta cualquier evaluador (no solo el gestor actual): lo que importa es
  -- que la persona haya sido evaluada, no quién lo hizo.
  select exists (
    select 1
    from public.team_members tm
    join public.teams t on t.id = tm.team_id
    where t.project_id = _project_id
      and not exists (
        select 1 from public.evaluations e
        where e.project_id = _project_id and e.evaluatee_id = tm.user_id
      )
  ) into _faltan_evaluaciones;

  if _faltan_evaluaciones then
    return 'faltan_evaluaciones';
  end if;

  if _milestone_estado = 'entregado' then
    update public.milestones set estado = 'aprobado'
    where id = _milestone_id and estado = 'entregado';
  end if;

  update public.projects set status = 'completado'
  where id = _project_id and status = 'activo';

  get diagnostics _filas = row_count;
  if _filas = 0 then
    return 'no_activo';
  end if;

  return 'ok';
end;
$$;
