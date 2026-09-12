-- ============================================================================
-- M31 · Cerrar un proyecto (activo → completado)
--
-- Igual que M29 con 'seleccion'/'activo': 'completado' está en el enum desde
-- M0 pero nunca se podía llegar a él. Se agrega la transición para la pantalla
-- "Validar entrega y evaluar" (S-06): el gestor cierra el proyecto una vez que
-- el equipo entregó el hito final. La regla de negocio (que exista un hito
-- final ya entregado) vive en la Server Action (`closeProject`), no acá — este
-- trigger solo valida QUIÉN puede hacer la transición, no las precondiciones.
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

  raise exception
    'Transición de estado no permitida: % → %', old.status, new.status
    using errcode = 'check_violation';
end;
$$;
