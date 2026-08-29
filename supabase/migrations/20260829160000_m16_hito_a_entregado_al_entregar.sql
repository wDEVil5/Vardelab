-- ============================================================================
-- M16 · Avance automático del hito al entregar
--
-- El ciclo de un hito es: pendiente → entregado → aprobado, con un desvío
-- posible entregado → en_progreso cuando el gestor pide cambios (y luego de
-- vuelta a entregado al re-entregar).
--
-- El salto a 'entregado' lo dispara el equipo al subir una entrega, pero la RLS
-- `milestones_write_manager` (M5) solo deja escribir el hito al gestor del
-- proyecto. Por eso el avance no puede vivir en la acción del estudiante: se
-- resuelve con un trigger `security definer` sobre el insert de submissions, que
-- corre con los privilegios de la función y sortea esa RLS.
-- ============================================================================

-- Marca el hito como 'entregado' cuando llega una entrega, solo si venía de
-- 'pendiente' o 'en_progreso' (un devuelto que se re-entrega vuelve a revisión).
-- Un hito ya 'aprobado' no se reabre por una entrega tardía.
create or replace function public.milestone_marcar_entregado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.milestones
     set estado = 'entregado'
   where id = new.milestone_id
     and estado in ('pendiente', 'en_progreso');
  return new;
end;
$$;

create trigger submissions_avanza_hito
  after insert on public.submissions
  for each row execute function public.milestone_marcar_entregado();
