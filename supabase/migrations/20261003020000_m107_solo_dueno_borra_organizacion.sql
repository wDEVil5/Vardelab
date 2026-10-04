-- M107: solo el dueño (o un admin) puede borrar una organización.
--
-- M38 dejó borrar a cualquier miembro activo. Borrar es irreversible y se lleva
-- en cascada los proyectos y evaluaciones de la organización, así que queda
-- reservado al dueño. Editar sigue abierto a los miembros (M38).

drop policy if exists "organizations_delete_own" on public.organizations;
create policy "organizations_delete_own"
  on public.organizations for delete
  using (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'::app_role));
