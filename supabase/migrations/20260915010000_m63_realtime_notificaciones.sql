-- ============================================================================
-- M63 · Realtime en las notificaciones del shell (reemplaza el sondeo de 25s)
--
-- `NotificationsProvider` sondeaba `notifications` cada ~25s como reemplazo
-- temporal, a falta de suscripciones Realtime en el proyecto (la primera fue
-- M49, sobre `project_messages`). Se agrega `notifications` a la misma
-- publicación para que el navegador reciba los INSERT nuevos por WebSocket.
-- Realtime respeta la RLS ya existente (`notifications_select_own`): cada
-- suscriptor solo recibe sus propias notificaciones, igual que en una
-- consulta normal.
-- ============================================================================

alter publication supabase_realtime add table public.notifications;
