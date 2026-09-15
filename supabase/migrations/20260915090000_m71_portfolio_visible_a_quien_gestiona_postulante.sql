-- ============================================================================
-- M71 · El portafolio de un postulante privado no lo veía quien lo gestiona
--
-- M13 ya dejaba ver el perfil completo de un postulante a quien gestiona el
-- proyecto al que postuló, y M34 hizo lo mismo con sus habilidades — en ambos
-- casos porque, con los perfiles naciendo 'privado' (M1), sin esa excepción el
-- gestor no tenía forma de evaluar a alguien que no hubiera hecho público su
-- perfil (mismo criterio que usa la industria: postular es consentimiento
-- implícito para que ESE reclutador puntual vea el perfil, no para cualquiera).
--
-- `portfolio_items` — la evidencia real de trabajo, probablemente el dato más
-- relevante para decidir — nunca recibió la misma excepción:
-- `portfolio_items_select_public_or_own` (M6) solo deja ver ítems marcados
-- 'publico', o los del dueño, o un admin. Se agrega el mismo patrón de M34.
-- ============================================================================

create policy "portfolio_items_select_managed_applicant"
  on public.portfolio_items for select
  using (public.manages_applicant(profile_id));
