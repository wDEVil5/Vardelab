import { createClient } from "@/lib/supabase/server";

/**
 * Usuario autenticado actual con su nombre de perfil, o `null` si no hay sesión.
 * Pensado para Server Components (header, guardas de página). Usa
 * `auth.getUser()`, que valida el token contra el servidor de Auth (no confía
 * solo en la cookie).
 */
export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // El nombre vive en profiles (lo crea el trigger al registrarse) y los roles
  // en user_roles. Se leen aparte; la RLS limita ambos a lo propio del usuario.
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("nombre").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  const rolesList = (roles ?? []).map((r) => r.role);

  return {
    id: user.id,
    email: user.email ?? "",
    nombre: profile?.nombre ?? user.email ?? "",
    roles: rolesList,
    esPatrocinador: rolesList.includes("patrocinador"),
    esEstudiante: rolesList.includes("estudiante"),
    esModerador: rolesList.includes("moderador"),
    esAdmin: rolesList.includes("admin"),
  };
}
