-- ============================================================================
-- M64 · Aviso de "hito próximo a vencer" (tipo reservado desde M39)
--
-- A diferencia del resto de las notificaciones (M39-M53), acá no hay un
-- evento de fila que dispare un trigger: nadie inserta ni actualiza nada
-- cuando una fecha se acerca. Hace falta un job programado que revise
-- `milestones` periódicamente — se usa `pg_cron` (extensión de Postgres, sin
-- infra nueva que mantener) en vez de una Edge Function con scheduled
-- trigger, porque todo el trabajo es una consulta + insert/update, sin
-- necesidad de llamar a ningún servicio externo (no manda correo: el enum ya
-- documentaba en M39 que este tipo tampoco tiene plantilla de email todavía).
--
-- Ventana: hitos cuya `fecha_limite` cae entre hoy y los próximos 3 días,
-- sin entrega ya aprobada (`estado <> 'aprobado'`) y sin entrega registrada
-- todavía (`estado <> 'entregado'` — si ya se entregó, el equipo no tiene
-- ninguna acción pendiente, solo está esperando revisión del gestor).
--
-- Dedup: como el job corre todos los días, sin algo que lo frene repetiría
-- el aviso cada vez que vuelve a correr mientras el hito siga sin aprobar.
-- `aviso_vencimiento_enviado_at` marca que ya se avisó una vez; si el hito
-- se retrasa más allá de la ventana o cambia de fecha límite, no hay un
-- segundo aviso — es un recordatorio único, no una alarma que se repite.
-- ============================================================================

alter table public.milestones
  add column aviso_vencimiento_enviado_at timestamptz;

create extension if not exists pg_cron;

create or replace function public.notificar_hitos_por_vencer()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, tipo, mensaje, link)
  select
    tm.user_id,
    'hito_por_vencer',
    'El hito "' || m.titulo || '" ' ||
      case (m.fecha_limite - current_date)
        when 0 then 'vence hoy.'
        when 1 then 'vence mañana.'
        else 'vence en ' || (m.fecha_limite - current_date) || ' días.'
      end,
    '/proyecto/' || m.project_id
  from public.milestones m
  join public.teams t on t.project_id = m.project_id
  join public.team_members tm on tm.team_id = t.id
  where m.fecha_limite between current_date and current_date + interval '3 days'
    and m.estado in ('pendiente', 'en_progreso')
    and m.aviso_vencimiento_enviado_at is null;

  update public.milestones m
  set aviso_vencimiento_enviado_at = now()
  where m.fecha_limite between current_date and current_date + interval '3 days'
    and m.estado in ('pendiente', 'en_progreso')
    and m.aviso_vencimiento_enviado_at is null;
end;
$$;

select cron.schedule(
  'notificar-hitos-por-vencer',
  '0 13 * * *', -- una vez al día, 13:00 UTC (09:00 en Chile continental sin horario de verano)
  $$select public.notificar_hitos_por_vencer();$$
);
