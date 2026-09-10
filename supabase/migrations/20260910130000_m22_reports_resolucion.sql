-- ============================================================================
-- M22 · Nota de resolución de un reporte
--
-- La tabla `reports` (M7) no tenía dónde guardar qué hizo el moderador al
-- cerrar un reporte. Se agrega `resolucion`: la nota que deja al marcarlo
-- `resuelto` (mismo patrón que `comentario_moderacion` en projects, M21).
-- ============================================================================

alter table public.reports
  add column resolucion text,
  add constraint reports_resolucion_len
    check (resolucion is null or char_length(resolucion) <= 1000),
  add constraint reports_motivo_len
    check (char_length(motivo) between 1 and 200),
  add constraint reports_descripcion_len
    check (descripcion is null or char_length(descripcion) <= 1000);

comment on column public.reports.resolucion is
  'Nota que el moderador deja al resolver el reporte. Null mientras sigue abierto o en revisión.';
