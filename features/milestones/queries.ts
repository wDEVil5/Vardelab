import { createClient } from "@/lib/supabase/server";

/**
 * Hitos de un proyecto, ordenados por `orden` y luego por fecha de creación. La
 * RLS `milestones_select_if_project_visible` (M5) los deja ver a quien ve el
 * proyecto (gestor y miembros del equipo).
 */
export async function getProjectMilestones(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("milestones")
    .select("id, titulo, descripcion, fecha_limite, orden, estado")
    .eq("project_id", projectId)
    .order("orden")
    .order("created_at");

  if (error) {
    console.error("[getProjectMilestones]", error.message);
    throw error;
  }

  return data;
}

export type Milestone = Awaited<
  ReturnType<typeof getProjectMilestones>
>[number];
