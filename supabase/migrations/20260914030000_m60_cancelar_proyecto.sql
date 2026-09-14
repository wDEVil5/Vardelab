-- ============================================================================
-- M60 · Cancelar proyecto (D-01, hallazgo de la revisión de métricas del admin)
--
-- `cancelado` está en `project_status` desde el diseño original (PRD §6.2),
-- pero revisando el KPI "Publicados" del panel admin se confirmó que ningún
-- flujo de la app podía llevar un proyecto a ese estado — ni el gestor, ni el
-- moderador, ni siquiera el admin tenían un botón para hacerlo (solo era
-- alcanzable escribiendo directo en la base de datos). Decidido con el
-- usuario: el gestor puede cancelar su propio proyecto en cualquier momento
-- (salvo ya completado), y un admin puede cancelar cualquiera. Si el proyecto
-- ya tenía equipo, se le avisa — no es un cambio silencioso para quien ya
-- estaba trabajando en él.
-- ============================================================================

-- 1) TRIGGER: agrega la transición "cancelar" a la guarda de estados --------
-- Se reemplaza la función completa (mismo patrón que M24/M29/M31): el cuerpo
-- de M31 más una rama nueva. El admin ya podía cualquier transición desde
-- siempre (`es_admin` al principio de la función); esto es lo que faltaba
-- para el gestor.
create or replace function public.projects_guard_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  es_admin   boolean := public.has_role(auth.uid(), 'admin');
  es_mod     boolean := public.has_role(auth.uid(), 'moderador');
  es_gestor  boolean := public.can_manage_project(new.id);
begin
  if new.status = old.status then
    return new;
  end if;

  if es_admin then
    return new;
  end if;

  if es_mod
     and old.status = 'en_revision'
     and new.status in ('publicado', 'borrador') then
    return new;
  end if;

  if es_gestor and (
       (old.status = 'borrador'    and new.status = 'en_revision') or
       (old.status = 'en_revision' and new.status = 'borrador') or
       (old.status = 'publicado'   and new.status = 'borrador') or
       (old.status = 'seleccion'   and new.status = 'activo') or
       (old.status = 'activo'      and new.status = 'completado')
     ) then
    return new;
  end if;

  -- Piloto sin moderación previa obligatoria (o con autoaprobación activa):
  -- el gestor puede saltar directo a publicado.
  if es_gestor
     and old.status = 'borrador'
     and new.status = 'publicado'
     and (not public.pilot_moderacion_obligatoria() or public.pilot_autoaprobacion_activa()) then
    return new;
  end if;

  -- Transición automática (M29): la dispara el trigger de applications, no un
  -- cliente.
  if old.status = 'publicado' and new.status = 'seleccion' then
    return new;
  end if;

  -- Cancelar (M60): el gestor puede cancelar desde cualquier estado salvo uno
  -- ya completado (no tiene sentido cancelar algo que ya terminó bien) — el
  -- admin ya podía por el `es_admin` de arriba. `cancelado` es terminal: no
  -- hay ninguna regla que permita salir de él, ni siquiera para el gestor.
  if es_gestor
     and old.status not in ('completado', 'cancelado')
     and new.status = 'cancelado' then
    return new;
  end if;

  raise exception
    'Transición de estado no permitida: % → %', old.status, new.status
    using errcode = 'check_violation';
end;
$$;

-- 2) NOTIFICAR al cancelar --------------------------------------------------
-- Mismo patrón que `notify_mensaje_nuevo` (M53): función security definer +
-- trigger AFTER UPDATE. Avisa a dos grupos, excluyendo siempre a quien hizo el
-- cambio (`auth.uid()`):
--   · Equipo del proyecto, si ya existía uno — son quienes más se ven
--     afectados, ya estaban trabajando en algo que se acaba de cerrar.
--   · Quienes gestionan la organización dueña — cubre el caso de que sea un
--     admin quien cancela (el gestor no es el actor y necesita enterarse).
create or replace function public.notify_proyecto_cancelado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mensaje text;
begin
  v_mensaje := 'El proyecto "' || coalesce(new.titulo, 'un proyecto') || '" fue cancelado.';

  insert into public.notifications (user_id, tipo, mensaje, link)
  select tm.user_id, 'proyecto_cancelado', v_mensaje, '/proyecto/' || new.id
  from public.team_members tm
  join public.teams t on t.id = tm.team_id
  where t.project_id = new.id and tm.user_id <> auth.uid();

  insert into public.notifications (user_id, tipo, mensaje, link)
  select uid, 'proyecto_cancelado', v_mensaje, '/mis-proyectos/' || new.id
  from public.org_recipient_ids(new.org_id) as uid
  where uid <> auth.uid();

  return new;
end;
$$;

create trigger projects_notify_cancelado
  after update on public.projects
  for each row
  when (new.status = 'cancelado' and old.status is distinct from 'cancelado')
  execute function public.notify_proyecto_cancelado();
