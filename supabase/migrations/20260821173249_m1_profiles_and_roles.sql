-- ============================================================================
-- M1 · Identidad: profiles + user_roles
-- Perfil de negocio (1:1 con auth.users), roles del usuario, auto-alta del
-- perfil y políticas RLS.
-- ============================================================================

-- 1) TABLA profiles ----------------------------------------------------------
-- Info pública/de negocio del usuario, enlazada 1:1 con auth.users (gestionada
-- por Supabase). ON DELETE CASCADE: al borrar el usuario de auth, cae su perfil.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text,
  carrera     text,
  semestre    int,
  bio         text,
  avatar_url  text,
  visibility  visibility  not null default 'privado',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Mantiene updated_at en cada UPDATE (función definida en M0).
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 2) TABLA user_roles --------------------------------------------------------
-- Roles en tabla aparte para permitir varios por usuario (p. ej. estudiante que
-- además es mentor). unique(user_id, role) evita duplicados.
create table public.user_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        app_role not null,
  created_at  timestamptz not null default now(),
  unique (user_id, role)
);

-- 3) FUNCIÓN has_role() ------------------------------------------------------
-- Indica si un usuario tiene cierto rol. 'security definer' hace que corra con
-- permisos del dueño y saltee la RLS de user_roles: así se evita la recursión
-- infinita (una política que consultara user_roles volvería a dispararse sola).
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- 4) AUTO-ALTA del profile al crearse un auth.users --------------------------
-- Tras un alta en auth.users (registro), crea automáticamente su fila en profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre)
  values (new.id, new.raw_user_meta_data ->> 'nombre');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) ROW LEVEL SECURITY ------------------------------------------------------
-- Con RLS activa, el acceso queda denegado por defecto hasta que una política lo
-- permita. auth.uid() = id del usuario autenticado (proviene del JWT).
alter table public.profiles   enable row level security;
alter table public.user_roles enable row level security;

-- profiles: lectura permitida si el perfil es público o pertenece al usuario autenticado.
create policy "profiles_select_public_or_own"
  on public.profiles for select
  using (visibility = 'publico' or id = auth.uid());

-- profiles: cada usuario solo puede crear su propio perfil.
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

-- profiles: cada usuario solo puede editar su propio perfil.
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- user_roles: cada usuario ve sus roles; un admin ve todos.
create policy "user_roles_select_own_or_admin"
  on public.user_roles for select
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- user_roles: solo un admin asigna/gestiona roles. El primer admin y los roles
-- iniciales se siembran con la service_role key (saltea RLS). La auto-asignación
-- de rol al registrarse se resuelve en el hito de Auth con una función controlada.
create policy "user_roles_admin_write"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
