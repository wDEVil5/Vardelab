-- M41: "evaluación nueva" ya tiene a dónde llevar. Se agregó una sección
-- "Tu evaluación" en `/proyecto/<id>` (solo lectura, contraparte del
-- formulario del gestor) — el link que M39/M40 dejaban en `null` por falta de
-- pantalla ahora apunta ahí.

create or replace function public.notify_evaluacion_nueva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_titulo text;
begin
  select titulo into v_titulo from public.projects where id = new.project_id;

  insert into public.notifications (user_id, tipo, mensaje, link)
  values (
    new.evaluatee_id,
    'evaluacion_nueva',
    'Recibiste una evaluación en "' || coalesce(v_titulo, 'un proyecto') || '".',
    '/proyecto/' || new.project_id
  );

  return new;
end;
$$;
