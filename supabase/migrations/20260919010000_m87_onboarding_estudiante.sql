-- ============================================================================
-- M87 · Onboarding corto tras registrarse (estudiante)
--
-- Hoy, al crear la cuenta, el estudiante cae directo a /inicio con el
-- perfil vacío (sin carrera/semestre) y tiene que acordarse de ir a /perfil
-- a completarlo. Se agrega un flag para mostrar, una única vez, un modal
-- corto pidiéndole esos datos (con opción de omitir) antes de entrar al
-- panel — la app decide cuándo mostrarlo según este flag, no hay lógica
-- nueva de RLS.
-- ============================================================================

alter table public.profiles
  add column onboarding_completado boolean not null default false;

-- Cuentas que ya existían antes de este cambio: no corresponde interrumpirlas
-- retroactivamente con el modal, se tratan como si ya lo hubieran completado.
update public.profiles set onboarding_completado = true;
