import { createClient } from "@/lib/supabase/server";

/**
 * Si el registro de cuentas nuevas está abierto (flag `pilot_registro_abierto`
 * en Postgres). Ante un error de red/RPC se asume abierto (`true`) para no
 * bloquear el registro por una falla ajena al flag en sí; el error se loguea
 * con el `caller` recibido para poder rastrear cuál de las dos pantallas de
 * /registro (modal o página completa) lo llamó.
 */
export async function isRegistroAbierto(caller: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pilot_registro_abierto");

  if (error) {
    console.error(`[${caller}:pilot_registro_abierto]`, error.message);
  }

  return error ? true : data !== false;
}

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

  // El nombre y la foto viven en profiles (lo crea el trigger al registrarse)
  // y los roles en user_roles. Se leen aparte; la RLS limita ambos a lo propio
  // del usuario.
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("nombre, avatar_url, onboarding_completado")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  const rolesList = (roles ?? []).map((r) => r.role);

  return {
    id: user.id,
    email: user.email ?? "",
    nombre: profile?.nombre ?? user.email ?? "",
    avatarUrl: profile?.avatar_url ?? null,
    onboardingCompletado: profile?.onboarding_completado ?? true,
    roles: rolesList,
    esPatrocinador: rolesList.includes("patrocinador"),
    esEstudiante: rolesList.includes("estudiante"),
    esModerador: rolesList.includes("moderador"),
    esAdmin: rolesList.includes("admin"),
  };
}
