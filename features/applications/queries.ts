import { createClient } from "@/lib/supabase/server";

/**
 * Capa de datos de postulaciones (lado del estudiante).
 */

/**
 * IDs de los roles a los que el usuario actual ya postuló, dentro de un
 * proyecto. Devuelve un Set para consultar en O(1) al pintar los roles.
 * Vacío si no hay sesión. La RLS ya limita a las postulaciones propias.
 */
export async function getMyApplicationRoleIds(
  projectRoleIds: string[],
): Promise<Set<string>> {
  if (projectRoleIds.length === 0) return new Set();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Set();

  const { data, error } = await supabase
    .from("applications")
    .select("project_role_id")
    .eq("applicant_id", user.id)
    .in("project_role_id", projectRoleIds);

  if (error) {
    console.error("[getMyApplicationRoleIds]", error.message);
    return new Set();
  }

  return new Set(data.map((a) => a.project_role_id));
}

/**
 * Postulaciones del usuario actual, de la más reciente a la más antigua, con el
 * rol, el proyecto y la organización. Vacío si no hay sesión. La RLS
 * (`applications_select_own_or_manager`) ya limita a las postulaciones propias.
 */
export async function getMyApplications() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      mensaje,
      created_at,
      role:project_roles!inner (
        id,
        nombre,
        project:projects!inner (
          id,
          titulo,
          organization:organizations ( nombre )
        )
      )
    `,
    )
    .eq("applicant_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getMyApplications]", error.message);
    throw error;
  }

  return data;
}

export type MyApplication = Awaited<
  ReturnType<typeof getMyApplications>
>[number];
