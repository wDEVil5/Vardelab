-- ============================================================================
-- M80 · Paginación real de /admin/organizaciones
--
-- Mismo anti-patrón que M79 (proyectos del admin): `getOrganizationsForAdmin`
-- traía TODAS las organizaciones y `OrganizationsTable` las filtraba en el
-- cliente. `security invoker`: `organizations_select_all` ya es `USING (true)`
-- (datos públicos), así que no hace falta ningún chequeo de rol extra acá.
-- ============================================================================

create or replace function public.admin_organizations_page(
  _q text default null,
  _verificacion text default null,
  _limit int default 20,
  _offset int default 0
)
returns table (id uuid, total_count bigint)
language sql
stable
as $$
  select o.id, count(*) over () as total_count
  from public.organizations o
  where (
      _verificacion is null or _verificacion = ''
      or o.verificacion = _verificacion::verification_status
    )
    and (
      _q is null or btrim(_q) = ''
      or o.nombre ilike (
        '%' || replace(replace(replace(_q, '\', '\\'), '%', '\%'), '_', '\_') || '%'
      )
    )
  order by o.created_at desc
  limit _limit offset _offset;
$$;
