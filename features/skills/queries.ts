import { createClient } from "@/lib/supabase/server";

/**
 * Catálogo de habilidades activas (id, nombre, categoría), ordenado por
 * categoría y nombre. La RLS `skills_select_active_or_admin` ya limita a las
 * activas. Se usa para poblar los selectores de habilidades de un rol.
 */
export async function getActiveSkills() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("skills")
    .select("id, nombre, categoria")
    .eq("activo", true)
    .order("categoria")
    .order("nombre");

  if (error) {
    console.error("[getActiveSkills]", error.message);
    throw error;
  }

  return data;
}

export type Skill = Awaited<ReturnType<typeof getActiveSkills>>[number];
