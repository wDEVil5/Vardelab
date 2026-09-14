-- ============================================================================
-- M53 · Notificar cuando llega un mensaje nuevo al hilo de un proyecto (M30)
--
-- El hilo de mensajes ahora tiene Realtime (M49), pero eso solo ayuda a quien
-- ya tiene la página abierta en ese momento. Si el estudiante no está mirando
-- el proyecto cuando el gestor escribe (o viceversa), no había ningún aviso —
-- el mensaje quedaba esperando sin que nada avisara que llegó.
--
-- Mismo patrón que el resto de notificaciones (M39/M40): una función
-- `security definer` disparada por un trigger de INSERT, usando
-- `org_recipient_ids` (ya existente) para la mitad "organización" de los
-- destinatarios. Se notifica a TODO el resto del hilo, no solo a "la otra
-- parte": si un estudiante le escribe al gestor, sus compañeros de equipo
-- también deberían enterarse (es un solo hilo compartido, no una
-- conversación 1 a 1). Quien mandó el mensaje nunca se notifica a sí mismo.
-- Cada lado recibe el link a SU propia vista del proyecto (el estudiante a
-- `/proyecto/<id>`, quien gestiona a `/mis-proyectos/<id>/seguimiento`).
-- ============================================================================

create or replace function public.notify_mensaje_nuevo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_titulo text;
  v_org_id uuid;
  v_remitente text;
  v_mensaje text;
begin
  select p.titulo, p.org_id into v_titulo, v_org_id
  from public.projects p where p.id = new.project_id;

  select nombre into v_remitente from public.profiles where id = new.sender_id;

  v_mensaje := coalesce(v_remitente, 'Alguien')
    || ' te escribió en "' || coalesce(v_titulo, 'un proyecto') || '".';

  -- Al equipo del proyecto.
  insert into public.notifications (user_id, tipo, mensaje, link)
  select tm.user_id, 'mensaje_nuevo', v_mensaje, '/proyecto/' || new.project_id
  from public.team_members tm
  join public.teams t on t.id = tm.team_id
  where t.project_id = new.project_id and tm.user_id <> new.sender_id;

  -- A quienes gestionan la organización dueña del proyecto.
  insert into public.notifications (user_id, tipo, mensaje, link)
  select uid, 'mensaje_nuevo', v_mensaje, '/mis-proyectos/' || new.project_id || '/seguimiento'
  from public.org_recipient_ids(v_org_id) as uid
  where uid <> new.sender_id;

  return new;
end;
$$;

create trigger project_messages_notify_insert
  after insert on public.project_messages
  for each row execute function public.notify_mensaje_nuevo();
