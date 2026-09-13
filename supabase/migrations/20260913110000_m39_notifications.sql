-- M39: notificaciones in-app.
--
-- Tabla `notifications` + triggers que insertan una fila cuando ocurre alguno
-- de estos eventos: postulación recibida (para el patrocinador), postulación
-- aceptada/rechazada (para el estudiante), invitación a una organización
-- (M37) y evaluación nueva (para el estudiante). Todavía no hay UI (eso viene
-- en un PR aparte) ni envío de correo (Brevo, más adelante).
--
-- Importante: el aviso de "hito próximo a vencer" queda FUERA de este PR.
-- A diferencia de los otros cuatro, no hay ninguna fila que se inserte o
-- actualice cuando una fecha simplemente se acerca — se necesitaría un job
-- programado (pg_cron + pg_net, o una Edge Function con cron) que no existe
-- en este proyecto todavía. El valor 'hito_por_vencer' se agrega al enum
-- igual, para no tener que alterarlo después.

create type notification_tipo as enum (
  'postulacion_recibida',
  'postulacion_aceptada',
  'postulacion_rechazada',
  'invitacion_organizacion',
  'evaluacion_nueva',
  'hito_por_vencer'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo notification_tipo not null,
  mensaje text not null,
  link text,
  leida boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- Solo el destinatario ve/modifica sus propias notificaciones. No hay policy
-- de insert: las filas nacen únicamente desde las funciones `security
-- definer` de abajo (dueñas de la tabla, no sujetas a RLS).
create policy notifications_select_own on public.notifications
  for select using (user_id = auth.uid());

create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy notifications_delete_own on public.notifications
  for delete using (user_id = auth.uid());

-- Ids de quienes gestionan una organización: su dueño + miembros activos
-- (mismo criterio de acceso que `is_org_member`, M37/M38, pero devolviendo
-- la lista de ids en vez de un booleano).
create or replace function public.org_recipient_ids(_org_id uuid)
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select owner_id from public.organizations where id = _org_id
  union
  select user_id from public.organization_members
  where org_id = _org_id and status = 'activo' and user_id is not null;
$$;

-- 1) Postulación recibida: avisa a quienes gestionan la organización dueña
-- del proyecto.
create or replace function public.notify_postulacion_recibida()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_titulo text;
  v_estudiante text;
begin
  select o.id, p.titulo into v_org_id, v_titulo
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
    '/mis-proyectos'
  from public.org_recipient_ids(v_org_id) as uid;

  return new;
end;
$$;

create trigger applications_notify_recibida
  after insert on public.applications
  for each row execute function public.notify_postulacion_recibida();

-- 2) Postulación aceptada/rechazada: avisa al estudiante. Solo dispara
-- cuando el estado cambia hacia uno de esos dos valores (una postulación
-- 'retirada' por el propio estudiante no genera notificación).
create or replace function public.notify_postulacion_estado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_titulo text;
  v_tipo notification_tipo;
begin
  if new.status = old.status or new.status not in ('aceptada', 'rechazada') then
    return new;
  end if;

  select p.titulo into v_titulo
  from public.project_roles r
  join public.projects p on p.id = r.project_id
  where r.id = new.project_role_id;

  v_tipo := case new.status
    when 'aceptada' then 'postulacion_aceptada'
    else 'postulacion_rechazada'
  end;

  insert into public.notifications (user_id, tipo, mensaje, link)
  values (
    new.applicant_id,
    v_tipo,
    case new.status
      when 'aceptada' then 'Tu postulación a "' || v_titulo || '" fue aceptada.'
      else 'Tu postulación a "' || v_titulo || '" fue rechazada.'
    end,
    '/mis-postulaciones'
  );

  return new;
end;
$$;

create trigger applications_notify_estado
  after update on public.applications
  for each row execute function public.notify_postulacion_estado();

-- 3) Invitación a organización (M37): avisa a la persona invitada, ya sea
-- que quede 'activa' de inmediato (ya tenía cuenta) o recién al registrarse
-- con ese correo (`handle_new_user` la activa ahí — por eso dos triggers:
-- uno para el insert directo, otro para cuando `user_id` pasa de null a un
-- valor).
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
    null
  );

  return new;
end;
$$;

create trigger organization_members_notify_insert
  after insert on public.organization_members
  for each row
  when (new.user_id is not null)
  execute function public.notify_invitacion_organizacion();

create trigger organization_members_notify_activada
  after update of user_id on public.organization_members
  for each row
  when (old.user_id is null and new.user_id is not null)
  execute function public.notify_invitacion_organizacion();

-- 4) Evaluación nueva: avisa al estudiante evaluado.
create or replace function public.notify_evaluacion_nueva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_titulo text;
begin
  select titulo into v_titulo from public.projects where id = new.project_id;

  insert into public.notifications (user_id, tipo, mensaje, link)
  values (
    new.evaluatee_id,
    'evaluacion_nueva',
    'Recibiste una evaluación en "' || coalesce(v_titulo, 'un proyecto') || '".',
    null
  );

  return new;
end;
$$;

create trigger evaluations_notify_insert
  after insert on public.evaluations
  for each row execute function public.notify_evaluacion_nueva();
