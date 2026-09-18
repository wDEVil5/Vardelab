-- ============================================================================
-- M84 · Aceptar postulación: atómico en la base, no en dos pasos desde la app
--
-- `acceptApplication` (features/applications/actions.ts) contaba las
-- aceptadas del rol con un `select count`, y recién después hacía el
-- `update` — dos lecturas concurrentes podían pasar el chequeo de cupo antes
-- de que cualquiera escribiera, aceptando de más. Además, si sumar al
-- estudiante al equipo (`addToProjectTeam`) fallaba después del `update`, la
-- postulación quedaba `aceptada` sin que la persona apareciera en el equipo,
-- y el error solo se logueaba (nadie se enteraba).
--
-- `accept_application` mueve todo (chequeo de cupo, cambio de estado, alta
-- en el equipo) a una sola función `plpgsql`: el cuerpo de la función corre
-- en una única transacción implícita, así que un fallo en cualquier paso
-- revierte todo — no puede quedar la postulación aceptada sin equipo. El
-- `select ... for update` sobre `project_roles` es lo que cierra la ventana
-- de carrera real: serializa las aceptaciones concurrentes del mismo rol
-- (la segunda transacción espera a que la primera termine antes de poder
-- leer el conteo de aceptadas), algo que dos consultas sueltas desde la app
-- no pueden lograr.
-- ============================================================================

create or replace function public.accept_application(_application_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  _role_id uuid;
  _project_id uuid;
  _applicant_id uuid;
  _status application_status;
  _cupos int;
  _aceptadas int;
  _team_id uuid;
begin
  select project_role_id, applicant_id, status
    into _role_id, _applicant_id, _status
  from applications
  where id = _application_id;

  if not found then
    return 'no_encontrada';
  end if;

  -- Reautorización manual: `security definer` salta la RLS, así que acá se
  -- repite el mismo criterio que ya exigía la policy `applications_update_manager`.
  if not public.can_manage_role(_role_id) and not public.has_role(auth.uid(), 'admin') then
    raise exception 'No autorizado';
  end if;

  if _status <> 'enviada' then
    return 'ya_procesada';
  end if;

  -- Lock del rol: cualquier otra llamada a esta función para el mismo rol
  -- queda bloqueada acá hasta que esta transacción termine (commit o
  -- rollback) — el conteo de abajo ya no puede correr en paralelo con otro.
  select cupos, project_id into _cupos, _project_id
  from project_roles
  where id = _role_id
  for update;

  select count(*) into _aceptadas
  from applications
  where project_role_id = _role_id and status = 'aceptada';

  if _aceptadas >= _cupos then
    return 'sin_cupos';
  end if;

  update applications set status = 'aceptada' where id = _application_id;

  -- Equipo del proyecto (uno por proyecto: teams.project_id es unique).
  select id into _team_id from teams where project_id = _project_id;
  if _team_id is null then
    insert into teams (project_id) values (_project_id)
    on conflict (project_id) do nothing;
    select id into _team_id from teams where project_id = _project_id;
  end if;

  insert into team_members (team_id, user_id, project_role_id)
  values (_team_id, _applicant_id, _role_id)
  on conflict (team_id, user_id) do nothing;

  return 'ok';
end;
$$;

grant execute on function public.accept_application(uuid) to authenticated;
