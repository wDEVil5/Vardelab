-- ============================================================================
-- M92 · Nuevo valor de enum para notification_tipo: 'reporte_escalado'.
--
-- En su propio archivo, separado de M93 (que ya usa este valor en un
-- trigger): `ALTER TYPE ... ADD VALUE` no puede correr en la misma
-- transacción que algo que lo use (mismo criterio que M52/M59/M61/M75/M90).
-- ============================================================================

alter type notification_tipo add value 'reporte_escalado';
