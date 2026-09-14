-- ============================================================================
-- M52 · Nuevo tipo de notificación: mensaje nuevo en un proyecto
--
-- En una migración aparte porque Postgres no permite usar un valor de enum
-- recién agregado (`ALTER TYPE ... ADD VALUE`) dentro de la misma transacción
-- en la que se agrega — el trigger que lo usa (M53) necesita que este valor
-- ya esté confirmado.
-- ============================================================================

alter type notification_tipo add value 'mensaje_nuevo';
