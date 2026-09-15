-- ============================================================================
-- M68 · "Hito por vencer" no debe avisar de un proyecto cancelado/completado
--
-- Cancelar un proyecto (M60) no toca sus hitos: uno que estaba `pendiente`
-- sigue `pendiente` para siempre, aunque el proyecto ya esté cerrado. Sin este
-- fix, `notificar_hitos_por_vencer()` (M64) seguía avisando al equipo que un
-- hito estaba por vencer en un proyecto que ya cancelaron o completaron —
-- mismo bug encontrado y arreglado en paralelo en
-- `getUpcomingMilestonesForSponsor` (features/milestones/queries.ts), que
-- alimenta "Próximos hitos" en el inicio del patrocinador.
-- ============================================================================

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
  join public.projects p on p.id = m.project_id
  join public.teams t on t.project_id = m.project_id
  join public.team_members tm on tm.team_id = t.id
  where m.fecha_limite between current_date and current_date + interval '3 days'
    and m.estado in ('pendiente', 'en_progreso')
    and p.status not in ('cancelado', 'completado')
    and m.aviso_vencimiento_enviado_at is null;

  update public.milestones m
  set aviso_vencimiento_enviado_at = now()
  from public.projects p
  where p.id = m.project_id
    and m.fecha_limite between current_date and current_date + interval '3 days'
    and m.estado in ('pendiente', 'en_progreso')
    and p.status not in ('cancelado', 'completado')
    and m.aviso_vencimiento_enviado_at is null;
end;
$$;
