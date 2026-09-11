-- ============================================================================
-- M23 · El admin ve cualquier perfil (panel de usuarios y permisos, D-03)
--
-- `profiles_select_public_or_own` (M1) solo deja ver un perfil si es público o
-- propio. El panel de administración necesita listar y buscar entre TODOS los
-- usuarios del piloto (incluidos los que dejaron su perfil en privado), así
-- que hace falta una política adicional para admin. Se combina por OR con la
-- existente (varias políticas permisivas en la misma tabla se suman).
-- ============================================================================

create policy "profiles_select_admin"
  on public.profiles for select
  using (public.has_role(auth.uid(), 'admin'));
