-- ============================================================================
-- M9 · Evidencia de la postulación
-- La pantalla de postular (E-03) pide un "Enlace relevante" / evidencia, pero
-- applications solo tenía 'mensaje' y 'disponibilidad'. El PRD (§7.1) define la
-- postulación como "mensaje y evidencia": esta columna le da persistencia.
-- ADD COLUMN nullable: no toca datos existentes ni las políticas RLS de M4
-- (las policies de applications ya cubren la columna nueva).
-- ============================================================================

alter table public.applications
  add column evidencia text;
