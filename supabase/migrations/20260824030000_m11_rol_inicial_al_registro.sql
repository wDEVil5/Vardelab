-- ============================================================================
-- M11 · Rol inicial al registrarse
-- La RLS de user_roles solo permite escritura a un admin (ver M1), así que un
-- usuario recién creado no puede insertarse su propio rol. Se resuelve dentro
-- del trigger handle_new_user, que ya corre como 'security definer' (con
-- permisos del dueño y saltando la RLS): al crear el profile, también asigna el
-- rol inicial tomándolo de la metadata del registro.
--
-- Lista blanca: solo los roles de AUTOSERVICIO ('estudiante', 'patrocinador').
-- Cualquier otro valor —incluidos 'mentor', 'moderador', 'admin'— o su ausencia
-- caen en 'estudiante'. Así el registro nunca puede otorgarse un rol elevado;
-- esos se asignan aparte con la service_role key.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _rol app_role;
begin
  -- 1) Profile (igual que en M1).
  insert into public.profiles (id, nombre)
  values (new.id, new.raw_user_meta_data ->> 'nombre');

  -- 2) Rol inicial desde la metadata, restringido a la lista blanca.
  _rol := case new.raw_user_meta_data ->> 'rol'
            when 'patrocinador' then 'patrocinador'::app_role
            else 'estudiante'::app_role
          end;

  insert into public.user_roles (user_id, role)
  values (new.id, _rol)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

-- El trigger on_auth_user_created (M1) ya apunta a esta función; 'create or
-- replace' actualiza el cuerpo sin necesidad de recrearlo.
