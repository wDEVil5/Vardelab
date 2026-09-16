-- ============================================================================
-- M73 · Rol requerido para postular y para crear organización
--
-- Hallazgo al revisar qué pasa si alguien se registra con el rol "equivocado"
-- (a propósito o por error): el selector Estudiante/Patrocinador del registro
-- es 100% autodeclarado (M11), y hasta ahora NADA a nivel de datos comprobaba
-- que coincidiera con la acción que se intentaba hacer — la única barrera era
-- un redirect de página (`if (!user.esPatrocinador) redirect(...)`), que no
-- protege el server action ni, sobre todo, la RLS: cualquiera con sesión podía
-- invocar `createOrganization`/`applyToRole` directo sin pasar por esa página.
--
-- Dos huecos concretos:
--   1) `applications_insert_own` (M4/M33): cualquier usuario autenticado podía
--      postular a un rol, incluida una cuenta registrada solo como
--      'patrocinador'. Postular es una acción de estudiante.
--   2) `organizations_insert_own` (M3/M24): el `tipo = 'interna'` pasaba la
--      condición SIN pasar por el toggle `patrocinadores_externos` NI por
--      ningún chequeo de rol — y el formulario ofrece "Interna" como opción
--      normal del dropdown a cualquier usuario. Cualquiera con sesión podía
--      crear una organización y, con eso, publicar proyectos.
--
-- REGLA DE NEGOCIO (ahora reforzada en RLS, no solo en la UI):
--   · Solo cuentas con el rol 'estudiante' pueden insertar en `applications`.
--   · Solo cuentas con el rol 'patrocinador' (o un admin) pueden insertar en
--     `organizations` como dueñas (`owner_id = auth.uid()`), sea cual sea el
--     `tipo` elegido — 'interna' deja de ser una puerta lateral.
--   · Los roles no son excluyentes (M1): una cuenta puede tener ambos y
--     entonces puede hacer las dos cosas. Nadie se autoasigna un rol nuevo
--     después del registro (M11): eso lo hace un admin (`user_roles_admin_write`).
--   · El redirect de página sigue existiendo (mejor UX: evita mostrar un
--     formulario que la base va a rechazar), pero deja de ser la única
--     protección real.
-- ============================================================================

-- 1) applications: solo estudiante ------------------------------------------
drop policy "applications_insert_own" on public.applications;

create policy "applications_insert_own"
  on public.applications for insert
  with check (
    applicant_id = auth.uid()
    and public.has_role(applicant_id, 'estudiante')
    and exists (
      select 1
      from public.project_roles r
      join public.projects p on p.id = r.project_id
      where r.id = project_role_id and p.status in ('publicado', 'seleccion')
    )
  );

-- 2) organizations: solo patrocinador (o admin), cualquiera sea el tipo -----
drop policy "organizations_insert_own" on public.organizations;

create policy "organizations_insert_own"
  on public.organizations for insert
  with check (
    owner_id = auth.uid()
    and (
      public.has_role(auth.uid(), 'admin')
      or (
        public.has_role(auth.uid(), 'patrocinador')
        and (tipo = 'interna' or public.pilot_permite_patrocinadores_externos())
      )
    )
  );
