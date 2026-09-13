-- ============================================================================
-- M35 · Perfil de organización (S-01): logo y correo de contacto
--
-- El Figma de S-01 separa "Persona de contacto" y "Correo de contacto" en dos
-- campos; la tabla solo tenía `contacto` (texto libre). Se agrega
-- `contacto_email` sin tocar `contacto`, que pasa a usarse solo para el nombre
-- de la persona de referencia.
--
-- `organizations.logo_url` ya existía desde M0 pero nunca se conectó a nada:
-- no había bucket de Storage ni forma de subir un archivo. Mismo patrón que
-- M25 (avatares de perfil): un objeto por organización, nombrado con su propio
-- id, bucket público (el logo no es información sensible y así se evita
-- depender de URLs firmadas). La política de Storage no puede hacer un JOIN
-- contra `organizations`, así que reutiliza `owns_org()` (ya usada por la RLS
-- de `organizations_update_own`) para decidir quién puede subir/reemplazar el
-- logo de una organización dada.
-- ============================================================================

alter table public.organizations add column contacto_email text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'org-logos',
  'org-logos',
  true,
  2097152, -- 2 MB
  array['image/png', 'image/jpeg', 'image/webp']
);

create policy "org_logos_select_public"
  on storage.objects for select
  using (bucket_id = 'org-logos');

create policy "org_logos_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'org-logos'
    and (public.owns_org((name)::uuid) or public.has_role(auth.uid(), 'admin'::app_role))
  );

create policy "org_logos_update_own"
  on storage.objects for update
  using (
    bucket_id = 'org-logos'
    and (public.owns_org((name)::uuid) or public.has_role(auth.uid(), 'admin'::app_role))
  )
  with check (
    bucket_id = 'org-logos'
    and (public.owns_org((name)::uuid) or public.has_role(auth.uid(), 'admin'::app_role))
  );

create policy "org_logos_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'org-logos'
    and (public.owns_org((name)::uuid) or public.has_role(auth.uid(), 'admin'::app_role))
  );
