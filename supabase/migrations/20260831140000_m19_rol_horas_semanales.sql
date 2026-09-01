-- ============================================================================
-- M19 · Compromiso semanal por rol (claridad para estudiantes)
--
-- Un rol muestra hoy nombre, cupos y habilidades, pero no cuánta dedicación
-- exige. `horas_semanales` hace explícito el compromiso ("~6 h/semana"), un dato
-- clave para que un estudiante —sobre todo de primeros años— decida postular.
--
-- Es opcional (nullable): los roles existentes quedan sin valor y el patrocinador
-- puede completarlo. El nivel de entrada ("apto sin experiencia") NO se guarda:
-- se deriva de que todas las habilidades del rol exijan nivel 'básico'.
-- ============================================================================

alter table public.project_roles
  add column horas_semanales int
    check (horas_semanales is null or (horas_semanales >= 1 and horas_semanales <= 60));

comment on column public.project_roles.horas_semanales is
  'Dedicación estimada del rol en horas por semana (1–60). Null = sin definir.';
