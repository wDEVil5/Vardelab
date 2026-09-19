-- ============================================================================
-- M89 · Onboarding de patrocinador + campo "cargo"
--
-- Mismo mecanismo que M87 (onboarding de estudiante): reutiliza el flag
-- `profiles.onboarding_completado` ya existente, no hace falta uno nuevo,
-- porque es agnóstico de rol. Lo único que falta en el schema es un lugar
-- donde guardar el cargo de la persona en su organización (nadie lo pedía
-- hasta ahora: ni el registro ni el formulario de organización lo cubren,
-- ese es el nombre/tipo/descripción de la ORGANIZACIÓN, no de la persona).
-- ============================================================================

alter table public.profiles
  add column cargo text;
