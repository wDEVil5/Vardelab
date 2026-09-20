-- ============================================================================
-- M95 · Notificaciones in-app para reportes: recibido (staff) y resuelto
-- (quien reportó). Ninguno de los dos existía — M7 solo creaba la tabla, sin
-- ningún trigger de notificación (a diferencia de applications/organizations/
-- evaluations, que sí los tienen desde M39).
-- ============================================================================

-- 1) Reporte recibido: avisa a todo moderador/admin (broadcast, mismo
-- criterio que M93 para 'reporte_escalado' — no hay un dueño único del
-- reporte hasta que alguien lo toma).
create or replace function public.notify_reporte_recibido()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, tipo, mensaje, link)
  select user_id,
    'reporte_recibido',
    'Nuevo reporte: ' || new.motivo,
    '/moderacion/reportes/' || new.id
  from public.user_roles
  where role in ('moderador', 'admin');

  return new;
end;
$$;

create trigger reports_notify_recibido
  after insert on public.reports
  for each row execute function public.notify_reporte_recibido();

-- 2) Reporte resuelto: avisa a quien lo presentó (si la cuenta todavía
-- existe — `reporter_id` es SET NULL al borrarse, M7). Solo dispara cuando
-- el estado realmente cambia a 'resuelto' (no en cada UPDATE, p. ej. al
-- escalar).
create or replace function public.notify_reporte_resuelto()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = old.status or new.status != 'resuelto' or new.reporter_id is null then
    return new;
  end if;

  insert into public.notifications (user_id, tipo, mensaje, link)
  values (
    new.reporter_id,
    'reporte_resuelto',
    'Tu reporte sobre "' || new.motivo || '" fue resuelto.',
    '/mis-reportes'
  );

  return new;
end;
$$;

create trigger reports_notify_resuelto
  after update of status on public.reports
  for each row execute function public.notify_reporte_resuelto();
