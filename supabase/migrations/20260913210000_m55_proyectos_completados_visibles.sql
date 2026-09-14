-- ============================================================================
-- M55 · Un proyecto completado también se puede ver públicamente
--
-- Encontrado al probar el resumen del perfil público (M54): un proyecto en
-- estado 'completado' era invisible para cualquier visitante que no fuera
-- quien lo gestiona — la política solo dejaba pasar 'publicado' y
-- 'seleccion'. La consecuencia práctica: en cuanto un proyecto terminaba
-- (justo el momento en que más vale la pena mostrarlo), el nombre del
-- proyecto dejaba de poder aparecer junto a la evidencia del portafolio de
-- quien trabajó en él — el badge del proyecto en la tarjeta de portafolio se
-- volvía invisible sin ningún aviso.
--
-- Un proyecto completado no es más sensible que uno publicado buscando
-- postulantes o en selección de equipo (ambos ya exponen la ficha completa
-- del proyecto al público) — si acaso es menos sensible, porque ya no admite
-- postulaciones. Se agrega 'completado' al mismo criterio.
-- ============================================================================

drop policy "projects_select_published_or_manager" on public.projects;

create policy "projects_select_published_or_manager"
  on public.projects for select
  using (
    status = any (array['publicado', 'seleccion', 'completado']::project_status[])
    or can_manage_project(id)
    or has_role(auth.uid(), 'admin'::app_role)
  );
