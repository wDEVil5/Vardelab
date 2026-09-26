-- ============================================================================
-- M102 · Portafolio: exige pertenencia real al proyecto, y permiso explícito
-- del gestor antes de divulgar públicamente el nombre/resultado
--
-- Hallazgo (auditoría de reglas de negocio, 2026-09-26): `addPortfolioItem`
-- insertaba el `project_id` recibido del formulario sin comprobar que quien
-- lo envía haya integrado el equipo de ese proyecto, y la RLS
-- `portfolio_items_write_own` (M6) solo exigía `profile_id = auth.uid()` —
-- nunca tocaba `project_id`. Cualquier cuenta podía reclamar cualquier
-- proyecto real de la plataforma como propio en su ficha de portafolio.
-- `is_project_member(_project_id)` (M5) ya existe y hace exactamente esta
-- comprobación (auth.uid() integra el equipo del proyecto) — se reutiliza acá
-- en vez de duplicar la lógica.
--
-- Segundo cambio, decisión de producto (D2 de la auditoría, confirmada por el
-- dueño): antes de esta migración, una evidencia ligada a un proyecto nacía
-- pública con un solo clic del estudiante, sin ningún permiso del
-- patrocinador — ya documentado a propósito como brecha abierta en el
-- comentario de M24. `projects.autoriza_divulgacion` es el permiso mínimo
-- viable: un booleano por proyecto (no por material), que el gestor decide
-- cuándo quiera. Mientras sea `false`, una ficha ligada a ese proyecto no
-- puede marcarse pública — puede seguir siendo privada o ligarse sin
-- proyecto (evidencia anónima) si el estudiante quiere mostrar algo igual.
-- ============================================================================

alter table public.projects
  add column autoriza_divulgacion boolean not null default false;

comment on column public.projects.autoriza_divulgacion is
  'Permiso único por proyecto (no por material) que el gestor concede para que los integrantes muestren el nombre/resultado del proyecto en su portafolio público. Default false: no se asume autorización por publicar el proyecto ni por completarlo.';

drop policy "portfolio_items_write_own" on public.portfolio_items;

create policy "portfolio_items_write_own"
  on public.portfolio_items for all
  using (profile_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  with check (
    (profile_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
    -- Ligar la evidencia a un proyecto exige haber integrado su equipo.
    and (project_id is null or public.is_project_member(project_id))
    -- Publicarla ligada a un proyecto exige que el gestor haya autorizado
    -- divulgación de ESE proyecto. Privada o sin proyecto: sin restricción.
    and (
      visibility = 'privado'
      or project_id is null
      or exists (
        select 1 from public.projects p
        where p.id = project_id and p.autoriza_divulgacion
      )
    )
  );
