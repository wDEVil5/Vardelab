-- ============================================================================
-- M34 · El gestor no veía las habilidades de un postulante con perfil privado
--
-- `profiles` ya tenía `profiles_select_managed_applicant` (manages_applicant):
-- el gestor de un proyecto puede ver el perfil de quien le postuló, aunque sea
-- privado. `profile_skills` se quedó sin el mismo permiso — solo dejaba verlas
-- si el perfil era público o era el dueño. Como los perfiles son privados por
-- defecto, en la práctica el cálculo de "cuántas habilidades pedidas tiene el
-- postulante" (`matchCount`/`matchTotal`, badge "Recomendado" en S-04) daba
-- siempre 0 para cualquier estudiante que no hubiera hecho público su perfil.
-- ============================================================================

create policy "profile_skills_select_managed_applicant"
  on public.profile_skills for select
  using (public.manages_applicant(profile_id));
