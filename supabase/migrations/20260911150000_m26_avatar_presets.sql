-- ============================================================================
-- M26 · avatar_presets: catálogo de avatares predefinidos
--
-- Además de subir su propia foto (M25), un estudiante puede elegir un avatar
-- de una galería. El catálogo vive en una tabla (no archivos hardcodeados en
-- el código) para que quede editable sin tocar código: agregar, reordenar o
-- desactivar una opción es una fila, igual que ya funciona `skills` (M2).
-- Se siembra con placeholders (formas simples con los colores de marca) hasta
-- que se sumen las imágenes definitivas — reemplazar `url` no requiere migración.
-- ============================================================================

create table public.avatar_presets (
  id          uuid primary key default gen_random_uuid(),
  url         text not null,
  etiqueta    text not null,
  orden       int not null default 0,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger avatar_presets_set_updated_at
  before update on public.avatar_presets
  for each row execute function public.set_updated_at();

alter table public.avatar_presets enable row level security;

-- Lectura pública de los activos (cualquier usuario con sesión elige un avatar);
-- un admin ve también los desactivados para poder gestionarlos.
create policy "avatar_presets_select_active_or_admin"
  on public.avatar_presets for select
  using (activo = true or public.has_role(auth.uid(), 'admin'));

-- Solo un admin gestiona el catálogo.
create policy "avatar_presets_admin_write"
  on public.avatar_presets for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Placeholders: formas simples con los tokens de color de la marca
-- (ink/electric/sprout/coral), a reemplazar por las imágenes definitivas.
insert into public.avatar_presets (url, etiqueta, orden) values
  ('/avatar-presets/electric.svg', 'Electric',        1),
  ('/avatar-presets/sprout.svg',   'Sprout',          2),
  ('/avatar-presets/coral.svg',    'Coral',           3),
  ('/avatar-presets/ink-ring.svg', 'Ink con anillo',  4),
  ('/avatar-presets/split.svg',    'Electric/Sprout', 5),
  ('/avatar-presets/halo.svg',     'Halo',            6);
