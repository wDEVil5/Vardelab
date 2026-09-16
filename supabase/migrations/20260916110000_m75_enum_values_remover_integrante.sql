-- ============================================================================
-- M75 · Nuevos valores de enum para "quitar del equipo" (M76)
--
-- `ALTER TYPE ... ADD VALUE` no puede usarse en la misma transacción que su
-- primer uso (mismo motivo que M59/M60): va en una migración aparte de la que
-- agrega el trigger/RLS que los usa.
--
-- 'removida' (application_status) es distinto de 'rechazada': una postulación
-- 'rechazada' nunca llegó a 'aceptada'; 'removida' sí estuvo aceptada y en el
-- equipo, y el gestor la sacó después (p. ej. abandonó el proyecto). Mismo
-- criterio para 'postulacion_removida' (notification_tipo): un aviso propio,
-- no reutiliza 'postulacion_rechazada' porque el tono/motivo es distinto.
-- ============================================================================

alter type application_status add value 'removida';
alter type notification_tipo add value 'postulacion_removida';
