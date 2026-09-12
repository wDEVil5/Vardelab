-- ============================================================================
-- M25 · Bucket de Storage para fotos de perfil
--
-- `profiles.avatar_url` (ya usado por `perfilCompleto` en el cálculo de % de
-- perfil) no tenía ninguna forma de llenarse: no existía bucket ni política
-- de Storage. Un archivo por usuario, con el propio id como nombre (sin
-- carpeta): simplifica la política (comparar `name` contra `auth.uid()`) y
-- cada subida nueva sobrescribe la anterior (`upsert: true` desde la app).
-- Bucket público: la foto de perfil no es información sensible, y evita
-- depender de URLs firmadas o del servicio de transformación de imágenes
-- (`imgproxy`, que este proyecto no usa).
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB
  array['image/png', 'image/jpeg', 'image/webp']
);

-- Cualquiera puede ver las fotos de perfil (bucket público).
create policy "avatars_select_public"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Cada usuario solo puede subir/reemplazar/borrar su propia foto: el nombre
-- del objeto es su propio id.
create policy "avatars_insert_own"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and name = auth.uid()::text);

create policy "avatars_update_own"
  on storage.objects for update
  using (bucket_id = 'avatars' and name = auth.uid()::text)
  with check (bucket_id = 'avatars' and name = auth.uid()::text);

create policy "avatars_delete_own"
  on storage.objects for delete
  using (bucket_id = 'avatars' and name = auth.uid()::text);
