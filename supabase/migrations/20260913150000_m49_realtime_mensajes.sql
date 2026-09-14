-- ============================================================================
-- M49 · Realtime en el hilo de mensajes del proyecto (E-05/S-05)
--
-- Sin esto, un mensaje nuevo de la otra parte (gestor <-> equipo) solo se veía
-- al recargar la página: la sección de mensajes se sentía más una bitácora que
-- un chat. Se agrega `project_messages` a la publicación de Realtime de
-- Supabase para que el navegador pueda suscribirse a los INSERT nuevos vía
-- WebSocket. Realtime respeta las políticas RLS ya existentes de la tabla
-- (M30, `project_messages_select_participant`): cada suscriptor solo recibe
-- los mensajes de proyectos donde participa, igual que en una consulta normal.
-- ============================================================================

alter publication supabase_realtime add table public.project_messages;
