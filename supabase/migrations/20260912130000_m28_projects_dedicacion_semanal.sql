-- ============================================================================
-- M28 · Dedicación semanal esperada del proyecto
--
-- Campo de texto libre ("3-4 horas") que el patrocinador deja al crear el
-- proyecto, para que el estudiante sepa qué carga esperar antes de postular.
-- Es a nivel de texto libre porque la dedicación real puede variar por rol
-- (`project_roles.horas_semanales`, M19, es la que exige un número); este
-- campo es solo la expectativa general que se muestra en la ficha.
-- ============================================================================

alter table public.projects
  add column dedicacion_semanal text,
  add constraint projects_dedicacion_semanal_len
    check (dedicacion_semanal is null or char_length(dedicacion_semanal) <= 60);

comment on column public.projects.dedicacion_semanal is
  'Dedicación semanal esperada, en texto libre (ej: "3-4 horas"). Opcional.';
