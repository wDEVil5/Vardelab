-- ============================================================================
-- M62 · Verificar organización
--
-- Hallazgo al revisar los badges de "Organización verificada": el enum
-- `verification_status` (M8) y el badge en 5+ pantallas ya existían, pero
-- ningún flujo podía mover una organización de `sin_verificar`. Peor: la RLS
-- `organizations_update_own` no distingue columnas — cualquier dueño/miembro
-- de una organización ya podía, técnicamente, hacer un `update` directo y
-- ponerse `verificado` a sí mismo sin que nadie lo revisara. Este trigger
-- cierra ese hueco de seguridad además de habilitar el flujo real:
--
--   · Dueño/miembro: sin_verificar → en_revision (solicitar) y
--     en_revision → sin_verificar (retractar su propia solicitud).
--   · Admin: cualquier transición (aprobar a verificado, rechazar de vuelta a
--     sin_verificar, o revocar una verificación ya dada más adelante).
--
-- Decidido con el usuario: solo el admin aprueba/rechaza (no el moderador).
-- ============================================================================

create or replace function public.organizations_guard_verificacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  es_admin    boolean := public.has_role(auth.uid(), 'admin');
  es_miembro  boolean := public.is_org_member(new.id);
begin
  if new.verificacion = old.verificacion then
    return new;
  end if;

  if es_admin then
    return new;
  end if;

  if es_miembro and (
       (old.verificacion = 'sin_verificar' and new.verificacion = 'en_revision') or
       (old.verificacion = 'en_revision'   and new.verificacion = 'sin_verificar')
     ) then
    return new;
  end if;

  raise exception
    'Transición de verificación no permitida: % → %', old.verificacion, new.verificacion
    using errcode = 'check_violation';
end;
$$;

create trigger organizations_guard_verificacion
  before update on public.organizations
  for each row
  execute function public.organizations_guard_verificacion();

-- NOTIFICAR el resultado ------------------------------------------------------
-- Solo cuando el admin aprueba o rechaza (no al solicitar: pedir verificación
-- no le avisa a nadie por notificación — igual que enviar un proyecto a
-- revisión tampoco notifica al moderador, ambos aparecen en una cola en vez
-- de una notificación). Excluye siempre a quien hizo el cambio.
create or replace function public.notify_verificacion_organizacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tipo notification_tipo;
  v_mensaje text;
begin
  if new.verificacion = 'verificado' then
    v_tipo := 'organizacion_verificada';
    v_mensaje := '"' || coalesce(new.nombre, 'Tu organización') || '" ya está verificada.';
  elsif old.verificacion = 'en_revision'
        and new.verificacion = 'sin_verificar'
        and public.has_role(auth.uid(), 'admin') then
    -- Solo si fue el admin quien rechazó. Si en cambio fue el propio dueño/
    -- miembro retractando su solicitud, no hay nada que notificarle al resto
    -- de la organización — no es un rechazo, es que se arrepintieron.
    v_tipo := 'organizacion_no_verificada';
    v_mensaje := 'La verificación de "' || coalesce(new.nombre, 'tu organización') || '" no fue aprobada.';
  else
    return new;
  end if;

  insert into public.notifications (user_id, tipo, mensaje, link)
  select uid, v_tipo, v_mensaje, '/mis-organizaciones/' || new.id || '/editar'
  from public.org_recipient_ids(new.id) as uid
  where uid <> auth.uid();

  return new;
end;
$$;

create trigger organizations_notify_verificacion
  after update on public.organizations
  for each row
  when (new.verificacion is distinct from old.verificacion)
  execute function public.notify_verificacion_organizacion();
