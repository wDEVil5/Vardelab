-- ============================================================================
-- M8 · Alineación con el PRD
-- Agrega los campos que el PRD (§7.1, §8 flujos, §11) trata como de primera clase
-- y que no estaban en M1–M7. Todo es ADD COLUMN + enums nuevos: no toca datos ni
-- políticas RLS (las policies existentes ya cubren las columnas nuevas).
-- ============================================================================

-- 1) ENUMS nuevos ------------------------------------------------------------
-- Modalidad del proyecto (el catálogo filtra por esto, RF-05).
create type project_modality as enum ('presencial', 'remoto', 'hibrido');

-- Estado de un hito a lo largo del proyecto.
create type milestone_status as enum ('pendiente', 'en_progreso', 'entregado', 'aprobado');

-- Estado del equipo.
create type team_status as enum ('formando', 'activo', 'finalizado');

-- Estado de verificación de una organización (lo gestiona el moderador).
create type verification_status as enum ('sin_verificar', 'en_revision', 'verificado');

-- 2) profiles ----------------------------------------------------------------
-- intereses: áreas que le interesan (distinto de bio, que es la presentación corta).
-- disponibilidad: texto libre (ej. "10 h/sem, tardes").
-- enlaces: lista flexible de {label, url} (GitHub, portafolio, LinkedIn) sin migrar
-- cada vez que se agregue un tipo de enlace.
alter table public.profiles
  add column intereses      text,
  add column disponibilidad text,
  add column enlaces        jsonb not null default '[]'::jsonb;

-- 3) organizations -----------------------------------------------------------
-- verificacion: la moderación verifica a los patrocinadores antes de operar.
-- contacto: dato de contacto (correo o responsable).
alter table public.organizations
  add column verificacion verification_status not null default 'sin_verificar',
  add column contacto     text;

-- 4) projects ----------------------------------------------------------------
-- Núcleo que lee el estudiante y por el que filtra el catálogo:
-- problema (la necesidad), alcance, entregable, expectativas, modalidad y duración.
-- duracion_semanas admite NULL; el CHECK solo acota cuando hay valor (2–8 típico).
alter table public.projects
  add column problema         text,
  add column alcance          text,
  add column entregable       text,
  add column expectativas     text,
  add column modalidad        project_modality,
  add column duracion_semanas int check (duracion_semanas between 1 and 52);

-- 5) applications ------------------------------------------------------------
-- El estudiante postula con motivación (mensaje) y disponibilidad.
alter table public.applications
  add column disponibilidad text;

-- 6) teams -------------------------------------------------------------------
-- fecha_inicio del trabajo del equipo y estado del ciclo.
alter table public.teams
  add column fecha_inicio date,
  add column estado       team_status not null default 'formando';

-- 7) team_members ------------------------------------------------------------
-- contribucion: aporte del integrante, base para la evidencia de portafolio.
alter table public.team_members
  add column contribucion text;

-- 8) milestones --------------------------------------------------------------
-- estado del hito (avance del entregable).
alter table public.milestones
  add column estado milestone_status not null default 'pendiente';

-- 9) submissions -------------------------------------------------------------
-- archivo_url: enlace a un archivo en Storage (complementa 'url', que es un enlace externo).
alter table public.submissions
  add column archivo_url text;

-- 10) evaluations ------------------------------------------------------------
-- criterios: puntajes por criterio (jsonb). Se conserva 'puntaje' como nota global.
alter table public.evaluations
  add column criterios jsonb;
