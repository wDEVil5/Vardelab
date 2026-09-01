-- ============================================================================
-- M18 · Moderación de proyectos (revisión previa a la publicación)
--
-- Hasta M17 un proyecto pasaba directo `borrador → publicado` desde la acción
-- del gestor, sin revisión. Esta migración introduce la etapa `en_revision` y
-- restringe quién puede hacer cada transición:
--
--   · Gestor (dueño de la org): borrador → en_revision (enviar a revisión),
--     en_revision → borrador (retirar), publicado → borrador (despublicar).
--   · Moderador/admin: en_revision → publicado (aprobar), en_revision → borrador
--     (rechazar). El admin puede cualquier transición.
--
-- El "quién" (fila) lo controla la RLS; el "qué transición" lo controla un
-- trigger BEFORE UPDATE, que sí puede comparar el estado anterior con el nuevo
-- (algo que una policy no permite). Defensa en profundidad: aunque la RLS deje
-- tocar la fila, el trigger bloquea saltos de estado no permitidos.
-- ============================================================================

-- 1) RLS: el moderador puede VER y GESTIONAR proyectos que no le pertenecen ----
-- (el admin ya está cubierto por las policies de M3). Se necesita para que la
-- cola de moderación liste los proyectos en revisión y actúe sobre ellos.
create policy "projects_select_moderator"
  on public.projects for select
  to authenticated
  using (public.has_role(auth.uid(), 'moderador'));

create policy "projects_update_moderator"
  on public.projects for update
  to authenticated
  using (public.has_role(auth.uid(), 'moderador'))
  with check (public.has_role(auth.uid(), 'moderador'));

-- El moderador también ve los roles del proyecto (para revisar el alcance).
create policy "project_roles_select_moderator"
  on public.project_roles for select
  to authenticated
  using (public.has_role(auth.uid(), 'moderador'));

-- 2) TRIGGER: guarda de transiciones de estado ------------------------------
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
  -- Sin cambio de estado: se permite (edición de otros campos).
  if new.status = old.status then
    return new;
  end if;

  -- Admin: cualquier transición.
  if es_admin then
    return new;
  end if;

  -- Moderador: aprobar o rechazar desde revisión.
  if es_mod
     and old.status = 'en_revision'
     and new.status in ('publicado', 'borrador') then
    return new;
  end if;

  -- Gestor: enviar a revisión, retirar de revisión o despublicar.
  if es_gestor and (
       (old.status = 'borrador'    and new.status = 'en_revision') or
       (old.status = 'en_revision' and new.status = 'borrador') or
       (old.status = 'publicado'   and new.status = 'borrador')
     ) then
    return new;
  end if;

  raise exception
    'Transición de estado no permitida: % → %', old.status, new.status
    using errcode = 'check_violation';
end;
$$;

create trigger projects_status_guard
  before update of status on public.projects
  for each row execute function public.projects_guard_status();
