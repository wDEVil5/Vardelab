-- ============================================================================
-- M50 · Nombre visible entre quien gestiona un proyecto y su equipo
--
-- Al conectar Realtime al hilo de mensajes (M49) apareció un hueco que ya
-- existía desde antes (M30): el nombre de quien envía un mensaje se resuelve
-- leyendo `profiles.nombre`, pero la única política que permitía ver el
-- perfil de otra persona sin que fuera público era `profiles_select_teammate`
-- (compañeros del mismo equipo). Nunca cubría el caso más común del hilo: un
-- estudiante viendo el nombre de quien gestiona su proyecto, o el gestor
-- viendo el nombre de un integrante — ninguno de los dos "comparte equipo"
-- con el otro. El resultado era que el nombre de la organización siempre caía
-- al "Alguien" genérico salvo que su perfil fuera público.
--
-- `shares_project_with` extiende ese mismo criterio (visibilidad acotada a
-- gente con la que de verdad se interactúa) a esta relación: gestor↔equipo de
-- un proyecto en común, en cualquiera de las dos direcciones.
-- ============================================================================

create or replace function public.shares_project_with(_other uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- Yo integro un equipo cuyo proyecto lo gestiona `_other` (dueño de la
  -- organización, o miembro activo de ella).
  select exists (
    select 1
    from team_members tm
    join teams t on t.id = tm.team_id
    join projects p on p.id = t.project_id
    join organizations o on o.id = p.org_id
    where tm.user_id = auth.uid()
      and (
        o.owner_id = _other
        or exists (
          select 1 from organization_members om
          where om.org_id = o.id and om.user_id = _other and om.status = 'activo'
        )
      )
  )
  -- o `_other` integra un equipo cuyo proyecto lo gestiono yo.
  or exists (
    select 1
    from team_members tm
    join teams t on t.id = tm.team_id
    join projects p on p.id = t.project_id
    join organizations o on o.id = p.org_id
    where tm.user_id = _other
      and (
        o.owner_id = auth.uid()
        or exists (
          select 1 from organization_members om
          where om.org_id = o.id and om.user_id = auth.uid() and om.status = 'activo'
        )
      )
  );
$$;

create policy "profiles_select_project_partner"
  on public.profiles for select
  using (public.shares_project_with(id));
