-- ============================================================================
-- M78 · Paginación real del catálogo público (/proyectos)
--
-- Hallazgo de la prueba de carga (ver BACKEND.md, M77): con ~6.000 proyectos
-- sintéticos, `/proyectos` traía y renderizaba TODOS los proyectos publicados
-- en una sola respuesta (5.5MB de HTML, ~2.8s) — `filterProjects`/
-- `projectSkillFacets` (features/projects/filters.ts) ya lo advertían en un
-- comentario: "a escala real esto se movería a la base". Esto lo mueve.
--
-- Dos funciones nuevas, ambas `security invoker` (corren con los privilegios
-- de quien llama, así que la RLS de `projects` sigue aplicando tal cual —
-- incluida la separación anon/authenticated de M77):
--
--   1) `search_published_projects`: hace en SQL lo que antes hacía
--      `filterProjects` en JS sobre el arreglo completo — texto (título +
--      resumen, sin distinguir acentos vía `unaccent`), modalidad exacta y
--      "algún rol exige esta habilidad" (exists) — y pagina con
--      limit/offset, devolviendo el total vía `count(*) over()` para no
--      necesitar una segunda consulta de conteo.
--   2) `catalog_skill_facets`: la lista de habilidades para los chips, sin
--      pasar por la paginación ni por el filtro de habilidad (si no, elegir
--      un chip haría desaparecer al resto) — antes salía de recorrer TODOS
--      los proyectos en memoria; ahora es una consulta chica y acotada por
--      la cantidad de habilidades distintas del catálogo (no por la
--      cantidad de proyectos).
--
-- El resto de la ficha (organización, roles, cupos aceptados) lo sigue
-- resolviendo `features/projects/queries.ts` con `PROJECT_CARD_SELECT` de
-- siempre, sobre los ids que devuelve `search_published_projects` — así no
-- se duplica esa lógica dentro de SQL.
-- ============================================================================

create extension if not exists unaccent with schema extensions;

create or replace function public.search_published_projects(
  _q text default null,
  _skill text default null,
  _modalidad text default null,
  _limit int default 12,
  _offset int default 0
)
returns table (id uuid, total_count bigint)
language sql
stable
set search_path = public, extensions
as $$
  select p.id, count(*) over () as total_count
  from public.projects p
  where p.status = any (array['publicado', 'seleccion']::project_status[])
    and (
      _modalidad is null or _modalidad = ''
      or p.modalidad = _modalidad::project_modality
    )
    and (
      _q is null or btrim(_q) = ''
      or extensions.unaccent(p.titulo || ' ' || coalesce(p.resumen, '')) ilike (
        '%' || extensions.unaccent(
          replace(replace(replace(_q, '\', '\\'), '%', '\%'), '_', '\_')
        ) || '%'
      )
    )
    and (
      _skill is null or _skill = ''
      or exists (
        select 1
        from public.project_roles r
        join public.project_role_skills prs on prs.project_role_id = r.id
        join public.skills s on s.id = prs.skill_id
        where r.project_id = p.id and s.nombre = _skill
      )
    )
  order by p.created_at desc
  limit _limit offset _offset;
$$;

create or replace function public.catalog_skill_facets()
returns table (nombre text)
language sql
stable
as $$
  select distinct s.nombre
  from public.skills s
  join public.project_role_skills prs on prs.skill_id = s.id
  join public.project_roles r on r.id = prs.project_role_id
  join public.projects p on p.id = r.project_id
  where p.status = any (array['publicado', 'seleccion']::project_status[])
  order by s.nombre;
$$;
