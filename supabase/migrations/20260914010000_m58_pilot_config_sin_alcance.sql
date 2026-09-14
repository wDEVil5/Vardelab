-- ============================================================================
-- M58 · pilot_config sin "Alcance del piloto"
--
-- Tras M57 (que ya sacó "Máximo de estudiantes" y "Duración permitida" por no
-- tener ningún enforcement real), quedaba "Máximo de proyectos activos" solo
-- en su propia sección — con el mismo problema: se guardaba y se auditaba,
-- pero ningún punto de creación/publicación de proyectos lo revisaba.
--
-- Decisión con el usuario: en vez de dejarlo a medias, se saca también. El
-- día que se quiera controlar de verdad cuántos proyectos activos hay a la
-- vez, se vuelve a agregar junto con el chequeo real (contar proyectos en
-- estados activos antes de crear/publicar uno nuevo).
-- ============================================================================

alter table public.pilot_config
  drop column max_proyectos_activos;
