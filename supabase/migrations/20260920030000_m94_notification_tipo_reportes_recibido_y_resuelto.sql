-- ============================================================================
-- M94 · Nuevos valores de enum para notification_tipo: 'reporte_recibido' y
-- 'reporte_resuelto'.
--
-- En su propio archivo, separado de M95 (que ya los usa): `ALTER TYPE ...
-- ADD VALUE` no puede correr en la misma transacción que algo que lo use
-- (mismo criterio que M52/M59/M61/M75/M90/M92).
-- ============================================================================

alter type notification_tipo add value 'reporte_recibido';
alter type notification_tipo add value 'reporte_resuelto';
