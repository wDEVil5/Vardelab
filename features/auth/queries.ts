import { cache } from "react";
import { redirect } from "next/navigation";
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
 * Guard liviano para Server Actions: exige sesión (sin ir hasta `profiles`,
 * a diferencia de `getCurrentUser()`) y redirige si no la hay. Reemplaza el
 * bloque `auth.getUser()` + `if (!user) redirect(...)` que se repetía igual
 * en 20+ Server Actions. Recibe el `supabase` ya creado por el caller (no
 * crea uno nuevo) porque el caller siempre lo necesita después para sus
 * propias consultas.
 */
export async function requireUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  next?: string,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(next ? `/ingresar?next=${next}` : "/ingresar");
  return user;
}

/**
 * Usuario autenticado actual con su nombre de perfil, o `null` si no hay sesión.
 * Pensado para Server Components (header, guardas de página). Usa
 * `auth.getUser()`, que valida el token contra el servidor de Auth (no confía
 * solo en la cookie).
 *
 * Envuelta en `cache()` de React: memoiza por el ciclo de vida de un único
 * render de servidor (nunca entre requests ni entre usuarios distintos), así
 * que las varias llamadas por request (layout + cada página que también la
 * necesita) resuelven una sola vez el round-trip a `auth`/`profiles`/
 * `user_roles` en vez de repetirlo. No compite con el `force-dynamic` de
 * `app/(app)/layout.tsx` (ese evita el caché *entre* requests; esto memoiza
 * *dentro* de uno solo).
 */
export const getCurrentUser = cache(async () => {
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
      .select("nombre, avatar_url, onboarding_completado, moderador_intro_completado")
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
    moderadorIntroCompletado: profile?.moderador_intro_completado ?? true,
    roles: rolesList,
    esPatrocinador: rolesList.includes("patrocinador"),
    esEstudiante: rolesList.includes("estudiante"),
    esModerador: rolesList.includes("moderador"),
    esAdmin: rolesList.includes("admin"),
  };
});
