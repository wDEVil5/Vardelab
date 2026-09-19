-- ============================================================================
-- M91 · Notifica al rechazar un proyecto (hallazgo de auditoría del flujo de
-- gestión de proyectos)
--
-- `rejectProject` (en_revision → borrador con `comentario_moderacion`) ya
-- deja un banner visible en /mis-proyectos/[id], pero el gestor solo se
-- entera si entra a la app — a diferencia de aceptar/rechazar una
-- postulación, que sí dispara una notificación in-app (M76). Mismo patrón
-- que `notify_proyecto_cancelado` (M60): función security definer +
-- trigger AFTER UPDATE, avisa a quienes gestionan la organización.
--
-- El mismo tránsito en_revision→borrador también lo puede hacer el propio
-- gestor (retirar su proyecto de la cola, `retirarProjecto...` en
-- features/projects/actions.ts) — esa acción NO toca `comentario_moderacion`,
-- así que la condición del trigger exige que haya un comentario nuevo: solo
-- dispara para un rechazo real del moderador, no para un retiro voluntario.
-- ============================================================================

create or replace function public.notify_proyecto_rechazado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mensaje text;
begin
  v_mensaje := 'El proyecto "' || coalesce(new.titulo, 'un proyecto') ||
    '" volvió a borrador: un moderador pidió cambios.';

  insert into public.notifications (user_id, tipo, mensaje, link)
  select uid, 'proyecto_rechazado', v_mensaje, '/mis-proyectos/' || new.id
  from public.org_recipient_ids(new.org_id) as uid
  where uid <> auth.uid();

  return new;
end;
$$;

create trigger projects_notify_rechazado
  after update on public.projects
  for each row
  when (
    new.status = 'borrador'
    and old.status = 'en_revision'
    and new.comentario_moderacion is not null
    and new.comentario_moderacion is distinct from old.comentario_moderacion
  )
  execute function public.notify_proyecto_rechazado();
