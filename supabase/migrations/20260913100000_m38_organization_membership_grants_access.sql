-- ============================================================================
-- M38 · La membresía de organización da acceso real
--
-- M37 dejó la tabla `organization_members` y `is_org_member()`, pero nada
-- todavía los usaba: el acceso a proyectos, roles, hitos, postulaciones,
-- equipos y evaluaciones seguía siendo por `organizations.owner_id`
-- directamente. Este paso redefine los helpers de "¿puede gestionar esto?"
-- para que un miembro activo tenga el mismo acceso que el dueño — mismo
-- criterio elegido: dueño y miembros con permisos iguales.
--
-- `created_by`/`invited_by` no se tocan: siguen registrando quién hizo qué
-- (auditoría), pero dejan de ser el criterio de acceso.
-- ============================================================================

-- 1) Helpers: mismo nombre y firma, solo cambia `owner_id = auth.uid()` por
-- `is_org_member(...)`. `create or replace` no requiere tocar las políticas
-- que ya los usan (`can_manage_project`, `can_manage_role`, `can_manage_team`,
-- `manages_applicant`) — heredan el nuevo criterio solas.

create or replace function public.owns_org(_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_org_member(_org_id);
$$;

create or replace function public.can_manage_project(_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = _project_id and public.is_org_member(p.org_id)
  );
$$;

create or replace function public.can_manage_role(_role_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.project_roles r
    join public.projects p on p.id = r.project_id
    where r.id = _role_id and public.is_org_member(p.org_id)
  );
$$;

create or replace function public.can_manage_team(_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.teams t
    join public.projects p on p.id = t.project_id
    where t.id = _team_id and public.is_org_member(p.org_id)
  );
$$;

create or replace function public.manages_applicant(_applicant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from applications a
    join project_roles r on r.id = a.project_role_id
    join projects p on p.id = r.project_id
    where a.applicant_id = _applicant_id and public.is_org_member(p.org_id)
  );
$$;

-- 2) `organizations`: editar/eliminar la organización misma, mismo criterio.
-- (Crearla no aplica: no se puede ser miembro de una organización que
-- todavía no existe, así que `organizations_insert_own` queda como está.)

drop policy if exists "organizations_update_own" on public.organizations;
create policy "organizations_update_own"
  on public.organizations for update
  using (public.is_org_member(id) or public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.is_org_member(id) or public.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "organizations_delete_own" on public.organizations;
create policy "organizations_delete_own"
  on public.organizations for delete
  using (public.is_org_member(id) or public.has_role(auth.uid(), 'admin'::app_role));
