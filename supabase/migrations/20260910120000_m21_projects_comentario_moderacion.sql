-- ============================================================================
-- M21 · Motivo de rechazo del moderador
--
-- Hasta ahora rechazar un proyecto lo devolvía a `borrador` sin explicar por
-- qué: el patrocinador se quedaba sin saber qué corregir. Se agrega un campo
-- para que el moderador deje el motivo, que se muestra en la página de gestión
-- del proyecto.
--
-- Se limpia (vuelve a null) al aprobar o al reenviar a revisión: el motivo de
-- un rechazo anterior no debe quedar dando vueltas una vez que ya se atendió.
-- Eso lo hacen las acciones (`rejectProject`, `approveProject`,
-- `submitProjectForReview`), no un trigger — mismo nivel de confianza en la
-- capa de aplicación que ya tiene `revisado_at` (M20).
-- ============================================================================

alter table public.projects
  add column comentario_moderacion text,
  add constraint projects_comentario_moderacion_len
    check (comentario_moderacion is null or char_length(comentario_moderacion) <= 1000);

comment on column public.projects.comentario_moderacion is
  'Motivo que el moderador dejó al rechazar el proyecto. Null si nunca fue rechazado o si ya se resolvió.';
