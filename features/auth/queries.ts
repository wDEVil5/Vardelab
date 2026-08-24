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

  // El nombre vive en profiles (lo crea el trigger al registrarse). Se lee
  // aparte; si por algún motivo no existe, se cae al email.
  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    nombre: profile?.nombre ?? user.email ?? "",
  };
}
