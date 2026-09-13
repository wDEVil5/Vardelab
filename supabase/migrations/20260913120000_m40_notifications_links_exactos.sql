-- M40: corrige el `link` de dos notificaciones de M39 para que apunten al
-- lugar exacto en vez de a una lista genérica.
--
-- - "Postulación recibida" llevaba a `/mis-proyectos` (el listado completo);
--   ahora lleva a `/mis-proyectos/<id>/postulaciones`, la página de
--   postulaciones DE ESE proyecto puntual.
-- - "Invitación a organización" no tenía link; ahora lleva a
--   `/mis-organizaciones/<id>/miembros` (la organización a la que invitaron).
--   Sin efecto práctico mientras `INVITACIONES_HABILITADAS` siga en `false`
--   (no se generan invitaciones reales todavía), pero deja el dato correcto
--   desde ya para cuando se active.
--
-- "Evaluación nueva" queda sin link a propósito: hoy no existe ninguna
-- pantalla donde el estudiante vea sus evaluaciones (hueco aparte, no algo
-- que se resuelva solo cambiando el link).
--
-- `create or replace function` alcanza: no cambia la forma de la tabla ni
-- las policies, solo el cuerpo de las dos funciones — mismo patrón que M38.

create or replace function public.notify_postulacion_recibida()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_project_id uuid;
  v_titulo text;
  v_estudiante text;
begin
  select o.id, p.id, p.titulo into v_org_id, v_project_id, v_titulo
  from public.project_roles r
  join public.projects p on p.id = r.project_id
  join public.organizations o on o.id = p.org_id
  where r.id = new.project_role_id;

  select nombre into v_estudiante
  from public.profiles where id = new.applicant_id;

  insert into public.notifications (user_id, tipo, mensaje, link)
  select uid,
    'postulacion_recibida',
    coalesce(v_estudiante, 'Un estudiante') || ' postuló a "' || v_titulo || '".',
    '/mis-proyectos/' || v_project_id || '/postulaciones'
  from public.org_recipient_ids(v_org_id) as uid;

  return new;
end;
$$;

create or replace function public.notify_invitacion_organizacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org text;
begin
  select nombre into v_org from public.organizations where id = new.org_id;

  insert into public.notifications (user_id, tipo, mensaje, link)
  values (
    new.user_id,
    'invitacion_organizacion',
    'Te invitaron a co-gestionar "' || coalesce(v_org, 'una organización') || '".',
    '/mis-organizaciones/' || new.org_id || '/miembros'
  );

  return new;
end;
$$;
