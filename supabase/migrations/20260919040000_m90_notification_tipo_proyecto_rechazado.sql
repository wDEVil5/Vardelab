-- ============================================================================
-- M90 · Nuevo valor de enum para notificar el rechazo de un proyecto
--
-- `ALTER TYPE ... ADD VALUE` no puede usarse en la misma transacción que su
-- primer uso (mismo motivo que M52/M59/M61/M75) — por eso va en su propia
-- migración, separada del trigger que la usa (M91).
-- ============================================================================

alter type notification_tipo add value 'proyecto_rechazado';
