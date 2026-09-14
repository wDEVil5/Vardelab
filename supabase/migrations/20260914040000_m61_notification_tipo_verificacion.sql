-- ============================================================================
-- M61 · Nuevos tipos de notificación: verificación de organización
--
-- Primer paso de "verificar organización" (hallazgo al revisar los badges de
-- verificado: el enum `verification_status` y el trigger de UI ya existían
-- desde M8, pero ninguna acción de la app podía moverlo — la columna nacía
-- `sin_verificar` y se quedaba ahí para siempre). `ALTER TYPE ... ADD VALUE`
-- no puede usarse en la misma transacción que su primer uso, por eso va en
-- una migración aparte de la que agrega los triggers que los usan (M62).
-- ============================================================================

alter type notification_tipo add value 'organizacion_verificada';
alter type notification_tipo add value 'organizacion_no_verificada';
