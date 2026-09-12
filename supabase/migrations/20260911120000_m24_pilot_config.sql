-- ============================================================================
-- M24 · Configuración del piloto (D-05, deseable)
--
-- Tabla singleton (una sola fila, `id = true`) con los parámetros operativos
-- que el admin ajusta desde /admin/configuracion. Alcance de esta migración,
-- decidido con el usuario:
--
--   · moderacion_previa_obligatoria y autoaprobacion_proyectos SÍ cambian
--     comportamiento real: se conectan al trigger de M18 que gobierna las
--     transiciones de `projects.status`.
--   · patrocinadores_externos SÍ cambia comportamiento real: gatea qué tipo
--     de organización se puede crear.
--   · registro_abierto SÍ cambia comportamiento real: gatea `signUp()`.
--   · los límites de alcance (máximo de proyectos/estudiantes, duración) y
--     las 4 notificaciones quedan guardados y auditados, pero NO enforced
--     todavía — el envío real de notificaciones depende del correo
--     transaccional, aún pendiente.
--
-- No incluye "programas académicos" ni "sincronización institucional": eran
-- texto fijo del mockup sin ninguna entidad real detrás (no hay tabla de
-- programas, no hay función de sincronización planeada). Tampoco incluye
-- "publicación de evidencias requiere autorización": conectarlo de verdad
-- exige una cola de solicitud/aprobación (el estudiante hoy autopublica su
-- portafolio con un clic) que es un frente aparte — mostrar el toggle sin
-- esa cola detrás sería un control que parece real y no lo es.
-- ============================================================================

-- 1) TABLA pilot_config -------------------------------------------------------
-- `id boolean primary key default true check (id)` es el patrón estándar para
-- forzar una única fila: cualquier segundo insert choca contra la primary key.
create table public.pilot_config (
  id                                             boolean primary key default true check (id),
  max_proyectos_activos                          int not null default 10 check (max_proyectos_activos > 0),
  max_estudiantes                                int not null default 50 check (max_estudiantes > 0),
  duracion_min_semanas                           int not null default 2 check (duracion_min_semanas > 0),
  duracion_max_semanas                           int not null default 8 check (duracion_max_semanas >= duracion_min_semanas),
  registro_abierto                               boolean not null default true,
  moderacion_previa_obligatoria                  boolean not null default true,
  patrocinadores_externos                        boolean not null default true,
  autoaprobacion_proyectos                       boolean not null default false,
  notif_postulacion_recibida                     boolean not null default true,
  notif_hito_proximo_vencer                      boolean not null default true,
  notif_respuesta_moderacion                     boolean not null default true,
  notif_resumen_semanal                          boolean not null default false,
  updated_at                                     timestamptz not null default now(),
  updated_by                                     uuid references auth.users (id) on delete set null
);

insert into public.pilot_config (id) values (true);

create trigger pilot_config_set_updated_at
  before update on public.pilot_config
  for each row execute function public.set_updated_at();

alter table public.pilot_config enable row level security;

-- Solo un admin lee o edita la configuración desde la app. Los helpers de
-- abajo son SECURITY DEFINER precisamente para que un gestor/patrocinador
-- sin acceso a esta tabla igual pueda evaluarlos dentro de una policy o
-- trigger de otra tabla.
create policy "pilot_config_select_admin"
  on public.pilot_config for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "pilot_config_update_admin"
  on public.pilot_config for update
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 2) HELPERS de lectura (SECURITY DEFINER) -----------------------------------
create or replace function public.pilot_moderacion_obligatoria()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select moderacion_previa_obligatoria from public.pilot_config where id = true;
$$;

create or replace function public.pilot_autoaprobacion_activa()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select autoaprobacion_proyectos from public.pilot_config where id = true;
$$;

create or replace function public.pilot_permite_patrocinadores_externos()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select patrocinadores_externos from public.pilot_config where id = true;
$$;

-- Se llama vía `supabase.rpc()` desde `signUp()`, ANTES de que exista sesión
-- (no hay `auth.uid()` todavía) — por eso necesita ser SECURITY DEFINER y
-- quedar accesible para el rol `anon`, no solo `authenticated`.
create or replace function public.pilot_registro_abierto()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select registro_abierto from public.pilot_config where id = true;
$$;

grant execute on function public.pilot_registro_abierto() to anon, authenticated;

-- 3) CONECTAR moderación/autoaprobación al trigger de M18 --------------------
-- Se reemplaza la función completa: mismo cuerpo que M18 más una rama nueva
-- que permite al gestor publicar directo (`borrador → publicado`) cuando la
-- moderación previa está desactivada o la autoaprobación está activa.
create or replace function public.projects_guard_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  es_admin   boolean := public.has_role(auth.uid(), 'admin');
  es_mod     boolean := public.has_role(auth.uid(), 'moderador');
  es_gestor  boolean := public.can_manage_project(new.id);
begin
  if new.status = old.status then
    return new;
  end if;

  if es_admin then
    return new;
  end if;

  if es_mod
     and old.status = 'en_revision'
     and new.status in ('publicado', 'borrador') then
    return new;
  end if;

  if es_gestor and (
       (old.status = 'borrador'    and new.status = 'en_revision') or
       (old.status = 'en_revision' and new.status = 'borrador') or
       (old.status = 'publicado'   and new.status = 'borrador')
     ) then
    return new;
  end if;

  -- Piloto sin moderación previa obligatoria (o con autoaprobación activa):
  -- el gestor puede saltar directo a publicado.
  if es_gestor
     and old.status = 'borrador'
     and new.status = 'publicado'
     and (not public.pilot_moderacion_obligatoria() or public.pilot_autoaprobacion_activa()) then
    return new;
  end if;

  raise exception
    'Transición de estado no permitida: % → %', old.status, new.status
    using errcode = 'check_violation';
end;
$$;

-- 4) CONECTAR patrocinadores externos a la creación de organizaciones --------
drop policy "organizations_insert_own" on public.organizations;

create policy "organizations_insert_own"
  on public.organizations for insert
  with check (
    owner_id = auth.uid()
    and (
      tipo = 'interna'
      or public.pilot_permite_patrocinadores_externos()
      or public.has_role(auth.uid(), 'admin')
    )
  );
