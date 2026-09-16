-- ============================================================================
-- M74 · Rol visible en "Miembros de organización"
--
-- Pedido tras revisar M73: el gestor invita por correo (M37/M38) y hoy solo ve
-- "Activo" / "Invitación pendiente" — sabe si la persona ya tenía cuenta o no,
-- pero no qué rol tiene esa cuenta (p. ej. si está invitando a alguien que hoy
-- es 'estudiante' en la plataforma). Se agrega esa visibilidad.
--
-- Diseño acotado a propósito, para no convertir esto en un buscador de roles
-- por correo:
--   · La función SOLO devuelve roles de personas que YA son miembro activo de
--     una organización que el que llama YA gestiona (`is_org_member`) — no
--     acepta un correo suelto ni expone roles de cualquier usuario del sistema.
--   · No hay forma de usarla para "probar" si un correo cualquiera tiene cuenta
--     o qué rol tiene; solo aplica a gente que el propio gestor ya invitó y
--     fue aceptada.
-- ============================================================================

create or replace function public.organization_member_roles(_org_id uuid)
returns table (user_id uuid, role app_role)
language sql
stable
security definer
set search_path = public
as $$
  select ur.user_id, ur.role
  from public.user_roles ur
  join public.organization_members m
    on m.user_id = ur.user_id and m.status = 'activo'
  where m.org_id = _org_id
    and (public.is_org_member(_org_id) or public.has_role(auth.uid(), 'admin'));
$$;
