-- ============================================================================
-- M0 · Setup base
-- Extensiones, enums (listas cerradas de valores) y funciones helper.
-- Primera migración: el resto depende de esto.
-- ============================================================================

-- 1) EXTENSIONES -------------------------------------------------------------
-- pgcrypto habilita gen_random_uuid(), usado en las claves primarias.
create extension if not exists pgcrypto;

-- 2) ENUMS -------------------------------------------------------------------
-- Un enum es un tipo con un conjunto fijo de valores. La base rechaza cualquier
-- valor fuera de la lista (más estricto y seguro que un texto libre).

-- Roles posibles de un usuario (se usan en la tabla user_roles, en M1).
create type app_role as enum (
  'estudiante', 'patrocinador', 'mentor', 'moderador', 'admin'
);

-- Los 9 estados del ciclo de vida del proyecto (PRD §6.2).
create type project_status as enum (
  'borrador', 'en_revision', 'publicado', 'seleccion',
  'activo', 'revision_final', 'completado', 'suspendido', 'cancelado'
);

-- Estados de una postulación.
create type application_status as enum (
  'enviada', 'aceptada', 'rechazada', 'retirada'
);

-- Visibilidad de perfiles y evidencias de portafolio.
create type visibility as enum ('publico', 'privado');

-- Estados de un reporte de conducta/seguridad.
create type report_status as enum ('abierto', 'en_revision', 'resuelto');

-- Tipo de organización patrocinadora.
create type org_type as enum (
  'academica', 'social', 'emprendimiento', 'empresa', 'interna'
);

-- 3) FUNCIÓN: updated_at al día ----------------------------------------------
-- Trigger genérico: fija updated_at = now() en cada UPDATE.
-- Se engancha a cada tabla en su propia migración.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
