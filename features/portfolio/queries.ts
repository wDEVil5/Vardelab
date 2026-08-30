import { createClient } from "@/lib/supabase/server";

/**
 * Capa de datos del portafolio. Cada estudiante arma sus evidencias
 * (`portfolio_items`, M6): título, descripción, enlace y, opcionalmente, el
 * proyecto real al que corresponde. La visibilidad (`publico`/`privado`) la
 * controla el dueño; la RLS `portfolio_items_select_public_or_own` deja ver las
 * públicas a cualquiera y las propias al dueño.
 */

/**
 * Evidencias del portafolio del usuario actual (públicas y privadas), para el
 * editor en `/perfil`. Incluye el proyecto ligado si lo hay (embed normal:
 * `project_id` referencia `projects`, no `auth.users`).
 */
export async function getMyPortfolioItems() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("portfolio_items")
    .select(
      "id, titulo, descripcion, url, visibility, project:projects ( id, titulo )",
    )
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getMyPortfolioItems]", error.message);
    return [];
  }

  return data;
}

export type PortfolioItem = Awaited<
  ReturnType<typeof getMyPortfolioItems>
>[number];

/**
 * Perfil público de un estudiante + sus evidencias públicas, para la página
 * `/u/[id]`. `null` si el perfil no es público (la RLS `profiles_select_public_or_own`
 * solo devuelve la fila si `visibility = 'publico'`), lo que la página traduce a 404.
 */
export async function getPublicProfile(profileId: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, nombre, carrera, semestre, bio, intereses, enlaces")
    .eq("id", profileId)
    .eq("visibility", "publico")
    .maybeSingle();

  if (error) {
    console.error("[getPublicProfile]", error.message);
    return null;
  }
  if (!profile) return null;

  // Evidencias públicas del perfil (la RLS ya limita a las públicas; el filtro
  // explícito lo deja claro y excluye las privadas del propio dueño si mira su
  // página pública).
  const { data: items } = await supabase
    .from("portfolio_items")
    .select("id, titulo, descripcion, url, project:projects ( id, titulo )")
    .eq("profile_id", profileId)
    .eq("visibility", "publico")
    .order("created_at", { ascending: false });

  return { profile, items: items ?? [] };
}

export type PublicProfile = NonNullable<
  Awaited<ReturnType<typeof getPublicProfile>>
>;
