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
 * Perfil de un estudiante + sus evidencias, para la página `/u/[id]`. `null`
 * si quien mira no tiene ningún motivo para verlo → la página traduce eso a
 * 404.
 *
 * La página `/u/[id]` es el contexto público, por lo que acá se filtran las
 * evidencias a `visibility = 'publico'`. La RLS también permite que un gestor
 * vea evidencias privadas de sus postulantes para evaluación interna, pero esa
 * excepción no debe filtrarse a esta vista pública.
 * `profiles_select_public_or_own` (M1) ya cubre público/propio, pero además
 * están `profiles_select_managed_applicant` (M13, el gestor de un proyecto al
 * que esa persona postuló), `profiles_select_teammate` (M14, comparte equipo)
 * y `profiles_select_project_partner` (M50, participa del mismo proyecto).
 * El perfil y las habilidades siguen usando las excepciones de acceso
 * correspondientes para que el gestor pueda evaluar a sus postulantes; el
 * portafolio público, en cambio, no mezcla datos privados con los públicos.
 */
export async function getPublicProfile(profileId: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, nombre, carrera, semestre, bio, intereses, enlaces, avatar_url, created_at",
    )
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    console.error("[getPublicProfile]", error.message);
    return null;
  }
  if (!profile) return null;

  const [{ data: items }, { data: skills }, { data: completados }] = await Promise.all([
    supabase
      .from("portfolio_items")
      .select("id, titulo, descripcion, url, visibility, project:projects ( id, titulo )")
      .eq("profile_id", profileId)
      .eq("visibility", "publico")
      .order("created_at", { ascending: false }),
    supabase
      .from("profile_skills")
      .select("skill_id, nivel, skill:skills ( id, nombre )")
      .eq("profile_id", profileId),
    // Proyectos completados (M54): un valor de resumen para quien visita el
    // perfil, no la lista de proyectos en sí — la RLS de `projects` no deja
    // leer proyectos ya cerrados desde fuera, por eso es una función aparte.
    supabase.rpc("completed_projects_count", { _profile_id: profileId }),
  ]);

  return {
    profile,
    items: items ?? [],
    skills: skills ?? [],
    proyectosCompletados: completados ?? 0,
  };
}

export type PublicProfile = NonNullable<
  Awaited<ReturnType<typeof getPublicProfile>>
>;
