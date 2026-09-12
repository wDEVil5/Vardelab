-- ============================================================================
-- M29 · Activar los estados 'seleccion' y 'activo' del proyecto
--
-- El enum project_status incluye 'seleccion' y 'activo' desde M0, pero ningún
-- código los usaba: el trigger de transiciones (`projects_guard_status`, M18/
-- M24) no las permitía, así que un proyecto publicado se quedaba en
-- 'publicado' para siempre, aunque ya tuviera postulaciones o equipo formado.
--
-- Se agregan dos transiciones:
--   1) publicado → seleccion: automática, al llegar la primera postulación.
--      La dispara `applications_advance_project_to_seleccion` (trigger AFTER
--      INSERT en applications), no una acción del gestor — por eso el guard la
--      permite sin exigir `es_gestor`. Esto es seguro porque la única forma de
--      llegar a este UPDATE sigue siendo esta función `security definer`: la
--      RLS `projects_update_manager` de la tabla `projects` ya le impide a
--      cualquier otro cliente (el propio postulante incluido) hacer ese UPDATE
--      por su cuenta.
--   2) seleccion → activo: la hace el gestor con el botón "Confirmar equipo"
--      (features/applications/actions.ts), una vez que ya seleccionó a los
--      integrantes del equipo.
-- ============================================================================

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
       (old.status = 'seleccion'   and new.status = 'activo')
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

  -- Transición automática (ver encabezado): la dispara el trigger de
  -- applications, no un cliente.
  if old.status = 'publicado' and new.status = 'seleccion' then
    return new;
  end if;

  raise exception
    'Transición de estado no permitida: % → %', old.status, new.status
    using errcode = 'check_violation';
end;
$$;

-- Mueve el proyecto a 'seleccion' en cuanto llega su primera postulación.
-- No hace nada si el proyecto ya no está 'publicado' (ya está en selección,
-- activo, etc.): el UPDATE con WHERE status='publicado' no afecta filas.
create or replace function public.applications_advance_project_to_seleccion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
begin
  select pr.project_id into v_project_id
  from public.project_roles pr
  where pr.id = new.project_role_id;

  update public.projects
    set status = 'seleccion'
    where id = v_project_id
      and status = 'publicado';

  return new;
end;
$$;

create trigger applications_advance_project_to_seleccion
  after insert on public.applications
  for each row execute function public.applications_advance_project_to_seleccion();
