-- ============================================================================
-- M20 · Marca de revisión del proyecto (confianza para la organización)
--
-- La Fase 2 introdujo la aprobación del moderador antes de publicar. Para poder
-- mostrar de forma honesta un sello "Revisado por CampusLab", se registra cuándo
-- se aprobó: `revisado_at` se completa al pasar `en_revision → publicado`.
--
-- Es nullable: los proyectos que se publicaron sin pasar por moderación (datos
-- previos o seed) quedan sin marca y no muestran el sello. No se toca la RLS: el
-- valor lo escribe la acción de aprobar, sujeta a las políticas de M18.
-- ============================================================================

alter table public.projects
  add column revisado_at timestamptz;

comment on column public.projects.revisado_at is
  'Momento en que un moderador aprobó el proyecto (en_revision → publicado). Null = no revisado por CampusLab.';
