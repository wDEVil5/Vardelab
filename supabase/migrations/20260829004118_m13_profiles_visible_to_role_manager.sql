-- ============================================================================
-- M13 · El gestor puede ver el perfil de quien postuló a su proyecto
-- Los perfiles nacen 'privado' (M1), así que la política profiles_select
-- (público o propio) impide que un patrocinador vea el nombre de un postulante.
-- Un gestor que revisa candidatos necesita ese dato, acotado a los postulantes
-- de SUS proyectos. Se agrega una política SELECT permisiva (se combina con OR
-- con la existente) apoyada en una función security definer, siguiendo el patrón
-- de owns_org / can_manage_role (evita recursión de RLS al consultar otras
-- tablas dentro de la política).
-- ============================================================================

-- ¿El usuario actual gestiona algún proyecto al que _applicant_id postuló?
create or replace function public.manages_applicant(_applicant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    join public.project_roles r  on r.id = a.project_role_id
    join public.projects p       on p.id = r.project_id
    join public.organizations o  on o.id = p.org_id
    where a.applicant_id = _applicant_id
      and o.owner_id = auth.uid()
  );
$$;

-- profiles: además de público/propio (M1), lo ve quien gestiona un proyecto al
-- que esa persona postuló. Acotado a los postulantes de los proyectos propios.
create policy "profiles_select_managed_applicant"
  on public.profiles for select
  using (public.manages_applicant(id));
