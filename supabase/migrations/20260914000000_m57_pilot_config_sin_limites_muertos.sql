-- ============================================================================
-- M57 · pilot_config sin límites muertos
--
-- Revisando /admin/configuracion contra el mockup de Figma (D-05): "Máximo de
-- estudiantes" y "Duración permitida" se guardaban y se auditaban, pero
-- ningún otro punto del sistema los leía — ni el alta de cuentas, ni la
-- creación de proyectos (que acepta cualquier duración de 1 a 52 semanas
-- libremente, sin mirar `duracion_min_semanas`/`duracion_max_semanas`). Un
-- admin podía cambiar estos valores creyendo que limitaban algo real.
--
-- "Máximo de estudiantes" además duplicaba, de forma más confusa, lo que ya
-- resuelve el toggle "Registro de nuevas cuentas" (`registro_abierto`): para
-- cerrar el piloto a cuentas nuevas ya existe un control binario que sí
-- funciona.
--
-- "Máximo de proyectos activos" se deja igual: a diferencia de los otros dos,
-- sí podría valer la pena conectarlo a futuro (revisar el conteo de proyectos
-- activos antes de crear uno nuevo); se decide aparte, no se descarta acá.
-- ============================================================================

alter table public.pilot_config
  drop column max_estudiantes,
  drop column duracion_min_semanas,
  drop column duracion_max_semanas;
