-- ============================================================================
-- M83 · Rate limiting propio para login, registro y recuperación de contraseña
--
-- Hallazgo de la auditoría de seguridad: los Server Actions de auth
-- (signIn, signUp, requestPasswordReset) no tenían ningún límite propio,
-- dependiendo por completo de los límites nativos de Supabase Auth. Esto
-- agrega un límite acotado en la propia base, sin depender de un servicio
-- externo (Redis/Upstash) — suficiente para el volumen actual del piloto.
--
-- `check_rate_limit` es atómica: el `insert ... on conflict do update` toma
-- un lock de fila por `key`, así que dos requests concurrentes con la misma
-- key quedan serializados (sin ventana de carrera). `security definer`
-- porque se llama ANTES de autenticar (login, registro): no hay sesión con
-- la que la RLS pudiera filtrar nada, y la tabla en sí no expone RLS a
-- nadie (sin policies, solo se toca a través de esta función).
-- ============================================================================

create table public.rate_limits (
  key text primary key,
  intentos int not null default 1,
  window_start timestamptz not null default now()
);

alter table public.rate_limits enable row level security;
-- Sin policies deliberadamente: nadie lee/escribe esta tabla directo, solo
-- la función de abajo (security definer) la toca.

create or replace function public.check_rate_limit(
  _key text,
  _max_intentos int,
  _window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  intentos_actuales int;
begin
  insert into public.rate_limits (key, intentos, window_start)
  values (_key, 1, now())
  on conflict (key) do update
    set intentos = case
          when public.rate_limits.window_start < now() - make_interval(secs => _window_seconds)
            then 1
          else public.rate_limits.intentos + 1
        end,
        window_start = case
          when public.rate_limits.window_start < now() - make_interval(secs => _window_seconds)
            then now()
          else public.rate_limits.window_start
        end
  returning intentos into intentos_actuales;

  return intentos_actuales <= _max_intentos;
end;
$$;

grant execute on function public.check_rate_limit(text, int, int) to anon, authenticated;

-- Limpieza periódica manual: las filas vencidas (más de 1 día sin actividad)
-- no estorban en la práctica al volumen actual, pero conviene poder purgarlas
-- a mano si hace falta:
--   delete from public.rate_limits where window_start < now() - interval '1 day';
