-- ============================================================================
-- M93 · Escalar un reporte a admin.
--
-- Hueco marcado por el dueño del producto como "muy importante" al construir
-- la pantalla de responsabilidades del moderador (ver BACKEND.md): hoy
-- `resolveReport` solo permite que el propio moderador cierre el reporte con
-- una nota — no existe forma de pasarle el caso a un admin cuando el
-- moderador no puede o no debe decidir solo.
--
-- No se toca `status` (abierto/en_revision/resuelto): escalar es ortogonal al
-- estado del reporte, no un estado más. Un admin ya puede leer y resolver
-- cualquier reporte (`reports_select_own_or_moderator` / `reports_update_
-- moderator`, M7, ya incluyen 'admin') y ya tiene "Reportes" en su propio
-- sidebar (apunta a /moderacion/reportes) — no hace falta RLS nueva ni una
-- pantalla aparte, solo que el admin se entere de que un caso puntual lo
-- necesita a él.
-- ============================================================================

alter table public.reports
  add column escalado_admin boolean not null default false,
  add column escalado_nota  text,
  add column escalado_por   uuid references auth.users (id) on delete set null,
  add column escalado_at    timestamptz;

-- Avisa a todos los admins cuando un moderador escala un reporte. Broadcast
-- (no hay un admin "dueño" de un reporte, a diferencia de `org_recipient_ids`
-- para organizaciones) — se le inserta una notificación a cada fila de
-- `user_roles` con role = 'admin'.
create or replace function public.notify_reporte_escalado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.escalado_admin = old.escalado_admin then
    return new;
  end if;

  insert into public.notifications (user_id, tipo, mensaje, link)
  select user_id,
    'reporte_escalado',
    'Un moderador escaló un reporte: ' || new.motivo,
    '/moderacion/reportes/' || new.id
  from public.user_roles
  where role = 'admin';

  return new;
end;
$$;

create trigger reports_notify_escalado
  after update of escalado_admin on public.reports
  for each row
  when (new.escalado_admin = true and old.escalado_admin = false)
  execute function public.notify_reporte_escalado();
