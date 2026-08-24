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
