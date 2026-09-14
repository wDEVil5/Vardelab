-- ============================================================================
-- M59 · Nuevo tipo de notificación: proyecto cancelado
--
-- Primer paso de "cancelar proyecto" (D-01, hallazgo de la revisión de
-- métricas del admin: `cancelado` existía en el enum de estados desde el PRD
-- pero ninguna acción de la app podía llegar a él). `ALTER TYPE ... ADD VALUE`
-- no puede usarse en la misma transacción que su primer uso — por eso va en
-- una migración aparte de la que agrega el trigger que la usa (M60).
-- ============================================================================

alter type notification_tipo add value 'proyecto_cancelado';
