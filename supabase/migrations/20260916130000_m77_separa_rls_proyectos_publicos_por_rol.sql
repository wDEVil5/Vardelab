-- ============================================================================
-- M77 · Separar la RLS de "proyectos visibles" por rol (anon vs authenticated)
--
-- Hallazgo al hacer una prueba de carga local (≈6.000 proyectos sintéticos):
-- el catálogo público (`fetchPublishedProjects`, corre con el cliente
-- ANÓNIMO) tardaba ~139ms solo en el `select` de `projects`, contra ~2.9ms
-- corriendo la misma query sin RLS. La causa: "projects_select_published_or_manager"
-- no tenía `to authenticated`, así que aplicaba también a `anon` — y su
-- condición es un OR con `is_project_member(id)` / `can_manage_project(id)`
-- (cada una hace sus propias subconsultas), que Postgres evalúa fila por fila
-- para CADA proyecto que no matchea el filtro simple de status (borradores,
-- cancelados, etc.), aunque un visitante anónimo (auth.uid() = null) JAMÁS
-- puede ser miembro ni gestor de nada. Ese trabajo era 100% desperdiciado.
--
-- Confirmado con EXPLAIN ANALYZE (ver BACKEND.md):
--   · anon, policy original:        Seq Scan, 139ms
--   · anon, policy separada (esta): Seq Scan, 2.9ms   (~45x)
--   · authenticated, antes y después: ~150ms sin cambio (correcto: un
--     estudiante/gestor logueado SÍ necesita esos chequeos para ver sus
--     propios borradores/proyectos en gestión, así que no hay nada que
--     optimizar ahí sin perder esa visibilidad).
--
-- No es un problema de índices: se probó agregar
-- `projects (status, created_at desc)` primero y no cambió nada, porque el
-- filtro completo (RLS OR + status explícito de la app) no es indexable
-- mientras siga habiendo funciones de por medio — de ahí que este archivo
-- solo reescriba la policy, sin tocar índices.
-- ============================================================================

drop policy "projects_select_published_or_manager" on public.projects;

-- Visitantes anónimos: solo ven lo publicado. Sin funciones de membresía
-- (auth.uid() siempre es null para anon, así que is_project_member/
-- can_manage_project nunca podrían dar true de todos modos).
create policy "projects_select_public_anon"
  on public.projects for select
  to anon
  using (status = any (array['publicado','seleccion','completado']::project_status[]));

-- Usuarios logueados: mismo criterio de antes, sin cambios de comportamiento.
create policy "projects_select_published_or_manager"
  on public.projects for select
  to authenticated
  using (
    status = any (array['publicado','seleccion','completado']::project_status[])
    or public.is_project_member(id)
    or public.can_manage_project(id)
    or public.has_role(auth.uid(), 'admin')
  );
