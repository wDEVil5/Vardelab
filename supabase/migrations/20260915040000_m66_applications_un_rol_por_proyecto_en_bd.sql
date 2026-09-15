-- ============================================================================
-- M66 · "Un rol por proyecto" también en la base, no solo en el Server Action
--
-- La regla (2026-08-29, rama fix/una-postulacion-por-proyecto) vivía solo en
-- `applyToRole`: una consulta antes del insert que revisa si ya hay una
-- postulación `enviada`/`aceptada` en el mismo proyecto. Dos postulaciones
-- concurrentes del mismo estudiante a roles distintos del mismo proyecto
-- podían pasar ambas ese chequeo antes de que la primera se escribiera —
-- ventana de carrera real, aunque de baja probabilidad. Un índice único
-- parcial es la única forma de que esto sea imposible de verdad.
--
-- `applications` no tenía `project_id` propio (solo `project_role_id`, y de
-- ahí a `project_roles.project_id`), así que hace falta desnormalizarlo para
-- poder indexar por proyecto. Se mantiene con un trigger `before insert` en
-- vez de con un `default` de columna: un `default` no puede leer el valor de
-- `project_role_id` de la misma fila que se está insertando. El trigger
-- ignora cualquier `project_id` que llegue del cliente y lo recalcula
-- siempre desde `project_role_id` — la fuente de verdad es el rol, nunca lo
-- que mande el insert.
-- ============================================================================

alter table public.applications
  add column project_id uuid references public.projects (id) on delete cascade;

update public.applications a
set project_id = pr.project_id
from public.project_roles pr
where pr.id = a.project_role_id;

alter table public.applications
  alter column project_id set not null;

create index applications_project_id_idx on public.applications (project_id);

create or replace function public.applications_set_project_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.project_id := (
    select project_id from public.project_roles where id = new.project_role_id
  );
  return new;
end;
$$;

create trigger applications_set_project_id
  before insert on public.applications
  for each row execute function public.applications_set_project_id();

-- "Activa" = mismo criterio que ya usaba `applyToRole` en la app: `enviada` o
-- `aceptada`. Un rechazo o un retiro no cuentan, a propósito — no bloquean un
-- reintento con otro rol del mismo proyecto.
create unique index applications_un_activa_por_proyecto
  on public.applications (applicant_id, project_id)
  where status in ('enviada', 'aceptada');
