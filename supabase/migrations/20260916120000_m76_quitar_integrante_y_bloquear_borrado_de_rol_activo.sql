-- ============================================================================
-- M76 · Bloquear borrado de un rol con postulaciones activas + quitar del equipo
--
-- Hallazgo: `deleteRole` borraba un `project_role` sin ningún chequeo de
-- estado. `applications.project_role_id` es `ON DELETE CASCADE`, así que si el
-- rol ya tenía a alguien ACEPTADO, su postulación completa (mensaje, evidencia,
-- disponibilidad, fecha de aceptación) se borraba para siempre junto con el
-- rol — sin aviso, sin confirmación. `team_members.project_role_id` es
-- `ON DELETE SET NULL` (diseño correcto de M4: conserva al integrante), pero
-- quedaba con el rol vacío, sin ninguna explicación.
--
-- Peor: no existía NINGÚN flujo para sacar a alguien del equipo a propósito
-- (alguien que abandonó, por ejemplo) — borrar el rol era, en los hechos, el
-- único camino, aunque nunca se pensó para eso.
--
-- REGLA DE NEGOCIO:
--   1) Un rol NO se puede borrar mientras tenga una postulación 'enviada' o
--      'aceptada'. El gestor primero tiene que resolver las pendientes
--      (aceptar/rechazar) y sacar del equipo a quien ya esté aceptado.
--   2) Existe ahora un camino real para sacar a alguien del equipo
--      (`removeTeamMember`, M76 lado app): borra la fila de `team_members` y
--      pasa su postulación de 'aceptada' a 'removida' (M75) — se libera el
--      cupo del rol y el rol queda intacto, disponible para que postule
--      alguien más.
-- ============================================================================

-- 1) project_roles: separar el "for all" en policies propias, agregando el
-- chequeo de postulaciones activas solo al DELETE (insert/update siguen igual
-- que antes, sin ese chequeo — agregar una skill o crear un rol nuevo no
-- destruye nada).
drop policy "project_roles_write_manager" on public.project_roles;

create policy "project_roles_insert_manager"
  on public.project_roles for insert
  with check (public.can_manage_project(project_id) or public.has_role(auth.uid(), 'admin'));

create policy "project_roles_update_manager"
  on public.project_roles for update
  using (public.can_manage_project(project_id) or public.has_role(auth.uid(), 'admin'))
  with check (public.can_manage_project(project_id) or public.has_role(auth.uid(), 'admin'));

create policy "project_roles_delete_manager"
  on public.project_roles for delete
  using (
    (public.can_manage_project(project_id) or public.has_role(auth.uid(), 'admin'))
    and not exists (
      select 1 from public.applications a
      where a.project_role_id = project_roles.id
        and a.status in ('enviada', 'aceptada')
    )
  );

-- 2) Notificar también cuando el gestor saca a alguien ya aceptado del
-- equipo (antes el trigger solo reaccionaba a 'aceptada'/'rechazada').
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
  if new.status = old.status or new.status not in ('aceptada', 'rechazada', 'removida') then
    return new;
  end if;

  select p.titulo into v_titulo
  from public.project_roles r
  join public.projects p on p.id = r.project_id
  where r.id = new.project_role_id;

  v_tipo := case new.status
    when 'aceptada' then 'postulacion_aceptada'
    when 'removida' then 'postulacion_removida'
    else 'postulacion_rechazada'
  end;

  insert into public.notifications (user_id, tipo, mensaje, link)
  values (
    new.applicant_id,
    v_tipo,
    case new.status
      when 'aceptada' then 'Tu postulación a "' || v_titulo || '" fue aceptada.'
      when 'removida' then 'Ya no formas parte del equipo de "' || v_titulo || '".'
      else 'Tu postulación a "' || v_titulo || '" fue rechazada.'
    end,
    '/mis-postulaciones'
  );

  return new;
end;
$$;
