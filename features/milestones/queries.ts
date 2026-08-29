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

/**
 * Hitos de un proyecto con sus entregas anidadas, para la vista del equipo. La
 * RLS de milestones y submissions (M5) los limita a integrantes y gestor.
 */
export async function getMilestonesWithSubmissions(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("milestones")
    .select(
      `
      id, titulo, descripcion, fecha_limite, orden, estado,
      submissions ( id, url, nota, submitted_by, created_at )
    `,
    )
    .eq("project_id", projectId)
    .order("orden")
    .order("created_at");

  if (error) {
    console.error("[getMilestonesWithSubmissions]", error.message);
    return [];
  }

  return data;
}

export type MilestoneWithSubmissions = Awaited<
  ReturnType<typeof getMilestonesWithSubmissions>
>[number];
