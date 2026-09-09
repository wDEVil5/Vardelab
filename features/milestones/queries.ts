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
 * Un hito por id para la pantalla de entrega (E-06). Se toma `project_id` de la
 * propia fila del hito (no un join a `projects`): la RLS de milestones (M5) ya
 * deja verlo al integrante, mientras que leer `projects` puede estar restringido
 * al gestor. `null` si el usuario no ve el hito → la página hace 404.
 */
export async function getMilestoneById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("milestones")
    .select("id, titulo, descripcion, estado, project_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getMilestoneById]", error.message);
    return null;
  }

  return data;
}

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
