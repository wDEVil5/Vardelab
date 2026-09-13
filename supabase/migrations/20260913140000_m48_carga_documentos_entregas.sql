-- ============================================================================
-- M48 · Carga de documentos en las entregas de hitos (E-06)
--
-- `submissions.archivo_url` existe desde M8 pero nunca se conectó a nada: no
-- había bucket de Storage ni política que dejara subir un archivo. El modelo
-- sigue siendo "enlace + nota + archivo opcional" (no reemplaza `url`, que
-- sigue siendo lo correcto para un repo, un deploy o un Figma).
--
-- A diferencia de `avatars`/`org-logos` (M25/M35, públicos: una foto de perfil
-- o un logo no son sensibles), este bucket es PRIVADO: un documento entregado
-- puede ser trabajo interno del proyecto. Se generan URLs firmadas al leer, en
-- vez de una URL pública permanente.
--
-- Convención de ruta: `${project_id}/${milestone_id}/${archivo}` — la política
-- deriva el proyecto del primer segmento de la ruta con
-- `(storage.foldername(name))[1]`, reutilizando `is_project_member` y
-- `can_manage_project` (ya usados por la RLS de `submissions`, M5) en vez de
-- inventar una función nueva.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submission-files',
  'submission-files',
  false,
  20971520, -- 20 MB
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/zip',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
);

create policy "submission_files_select_member_or_manager"
  on storage.objects for select
  using (
    bucket_id = 'submission-files'
    and (
      public.is_project_member(((storage.foldername(name))[1])::uuid)
      or public.can_manage_project(((storage.foldername(name))[1])::uuid)
      or public.has_role(auth.uid(), 'admin'::app_role)
    )
  );

create policy "submission_files_insert_member"
  on storage.objects for insert
  with check (
    bucket_id = 'submission-files'
    and public.is_project_member(((storage.foldername(name))[1])::uuid)
  );

-- Borra el autor de la entrega o quien gestiona el proyecto (mismo criterio
-- que `submissions_delete_author_or_manager`, M5) — la política de Storage no
-- puede leer `submissions.submitted_by` directo (no hay join), así que se
-- apoya en ser integrante del equipo o gestor del proyecto.
create policy "submission_files_delete_member_or_manager"
  on storage.objects for delete
  using (
    bucket_id = 'submission-files'
    and (
      public.is_project_member(((storage.foldername(name))[1])::uuid)
      or public.can_manage_project(((storage.foldername(name))[1])::uuid)
      or public.has_role(auth.uid(), 'admin'::app_role)
    )
  );
