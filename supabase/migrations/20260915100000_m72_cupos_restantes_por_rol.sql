-- ============================================================================
-- M72 · El catálogo y la ficha pública mostraban cupos ya ocupados como libres
--
-- Ni el catálogo (`getPublishedProjects`) ni la ficha (`getPublishedProjectById`)
-- ni el formulario de postular (`getRoleForApplication`) contaban cuántas
-- postulaciones ya estaban `aceptada` por rol — solo mostraban `cupos`, el
-- total original. Reproducido: un rol con 1/1 cupo ya aceptado seguía
-- mostrando "1 cupo" y un botón activo "Postular a X" en la ficha pública,
-- justo al lado de "Equipo seleccionado" mostrando a quien ya lo ocupa.
--
-- `applications` es privada (`applications_select_own_or_manager`) — un
-- visitante anónimo no puede contarlas con una consulta normal. Se agrega una
-- función `security definer` que expone solo el conteo por rol, nunca las
-- postulaciones en sí (mismo criterio que `completed_projects_count`, M54).
--
-- Además, `applications_insert_own` (M33) solo validaba el estado del
-- proyecto, nunca los cupos del rol — nada impedía postular por API directa a
-- un rol ya lleno aunque la UI lo hubiera ocultado. Se agrega el chequeo de
-- cupos a la propia política: es la guarda real, la UI es solo la señal.
-- ============================================================================

create or replace function public.accepted_counts_for_roles(_role_ids uuid[])
returns table(project_role_id uuid, aceptadas bigint)
language sql
stable
security definer
set search_path = public
as $$
  select a.project_role_id, count(*)
  from applications a
  where a.project_role_id = any(_role_ids) and a.status = 'aceptada'
  group by a.project_role_id;
$$;

-- Conteo escalar, `security definer`, para usar DENTRO de la política de
-- abajo. Una subconsulta directa a `applications` ahí no sirve: quedaría
-- sujeta a la misma RLS que se está evaluando
-- (`applications_select_own_or_manager`), que para quien está postulando
-- (no es el postulante existente ni gestiona el rol) no deja ver la fila
-- `aceptada` de otra persona — el conteo daría 0 y la guarda nunca
-- bloquearía nada. Mismo motivo por el que `manages_applicant`,
-- `can_manage_role`, etc. son todas `security definer`.
create or replace function public.accepted_count_for_role(_role_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from applications
  where project_role_id = _role_id and status = 'aceptada';
$$;

drop policy "applications_insert_own" on public.applications;

create policy "applications_insert_own"
  on public.applications for insert
  with check (
    applicant_id = auth.uid()
    and exists (
      select 1
      from public.project_roles r
      join public.projects p on p.id = r.project_id
      where r.id = project_role_id
        and p.status in ('publicado', 'seleccion')
        and r.cupos > public.accepted_count_for_role(r.id)
    )
  );
