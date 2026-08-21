-- ============================================================================
-- M2 · Habilidades: skills (catálogo) + profile_skills (relación perfil-habilidad)
-- ============================================================================

-- ENUM local de esta migración (M0 ya está aplicada: no se edita, se agrega acá).
-- Nivel declarado de una habilidad en el perfil.
create type skill_level as enum ('basico', 'intermedio', 'avanzado');

-- 1) TABLA skills ------------------------------------------------------------
-- Catálogo de habilidades. Es dato de referencia (lo necesita toda la app),
-- por eso se siembra dentro de esta migración, no en seed.sql.
-- 'activo' permite desactivar una opción sin borrarla (preserva datos históricos).
create table public.skills (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null unique,
  categoria   text not null,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger skills_set_updated_at
  before update on public.skills
  for each row execute function public.set_updated_at();

-- 2) TABLA profile_skills ----------------------------------------------------
-- Relación N:N entre perfiles y habilidades. unique(profile_id, skill_id) evita
-- repetir una habilidad en el mismo perfil.
-- ON DELETE de skill_id es RESTRICT: no se borra una habilidad que está en uso
-- (el catálogo se desactiva, no se elimina).
create table public.profile_skills (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  skill_id    uuid not null references public.skills (id)   on delete restrict,
  nivel       skill_level,
  evidencia   text,
  created_at  timestamptz not null default now(),
  unique (profile_id, skill_id)
);

-- Índice para consultar rápido las habilidades de un perfil.
create index profile_skills_profile_id_idx on public.profile_skills (profile_id);

-- 3) ROW LEVEL SECURITY ------------------------------------------------------
alter table public.skills         enable row level security;
alter table public.profile_skills enable row level security;

-- skills: lectura pública de las activas (el catálogo alimenta filtros públicos);
-- un admin ve también las inactivas.
create policy "skills_select_active_or_admin"
  on public.skills for select
  using (activo = true or public.has_role(auth.uid(), 'admin'));

-- skills: solo un admin crea, edita o desactiva el catálogo.
create policy "skills_admin_write"
  on public.skills for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- profile_skills: lectura si la habilidad es de un perfil público o del propio usuario.
create policy "profile_skills_select_public_or_own"
  on public.profile_skills for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = profile_skills.profile_id
        and (p.visibility = 'publico' or p.id = auth.uid())
    )
  );

-- profile_skills: cada usuario gestiona solo las habilidades de su propio perfil.
create policy "profile_skills_write_own"
  on public.profile_skills for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- 4) SEED del catálogo -------------------------------------------------------
-- Habilidades iniciales del piloto (foco en informática, con áreas afines).
-- ON CONFLICT DO NOTHING lo hace idempotente (re-ejecutar no duplica).
insert into public.skills (nombre, categoria) values
  ('Frontend',            'Desarrollo'),
  ('Backend',             'Desarrollo'),
  ('Bases de datos',      'Desarrollo'),
  ('Móvil',               'Desarrollo'),
  ('Automatización',      'Desarrollo'),
  ('DevOps',              'Desarrollo'),
  ('UX/UI',               'Diseño'),
  ('Diseño gráfico',      'Diseño'),
  ('Prototipado (Figma)', 'Diseño'),
  ('Análisis de datos',   'Datos'),
  ('Visualización',       'Datos'),
  ('Contenidos',          'Comunicación'),
  ('Redacción',           'Comunicación'),
  ('Comunicación',        'Comunicación'),
  ('Investigación',       'Gestión'),
  ('Gestión de proyectos','Gestión')
on conflict (nombre) do nothing;
