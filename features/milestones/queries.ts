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

export type UpcomingMilestone = {
  id: string;
  titulo: string;
  fecha_limite: string;
  estado: string;
  projectId: string;
  projectTitulo: string | null;
};

/**
 * Próximos hitos (con fecha límite, todavía sin aprobar) entre todos los
 * proyectos propios del patrocinador, de más próximo a más lejano — para el
 * inicio, donde hoy no había forma de ver qué se vence pronto sin entrar al
 * seguimiento de cada proyecto por separado.
 */
export async function getUpcomingMilestonesForSponsor(
  limit: number,
): Promise<UpcomingMilestone[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("milestones")
    .select(
      `
      id,
      titulo,
      fecha_limite,
      estado,
      project:projects!inner ( id, titulo, created_by )
    `,
    )
    .eq("project.created_by", user.id)
    .not("fecha_limite", "is", null)
    .in("estado", ["pendiente", "en_progreso"])
    .order("fecha_limite", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[getUpcomingMilestonesForSponsor]", error.message);
    throw error;
  }

  return (data ?? []).map((m) => ({
    id: m.id,
    titulo: m.titulo,
    fecha_limite: m.fecha_limite as string,
    estado: m.estado,
    projectId: m.project?.id ?? "",
    projectTitulo: m.project?.titulo ?? null,
  }));
}

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

export type MilestoneActivity = {
  id: string;
  milestoneTitulo: string;
  actorNombre: string | null;
  created_at: string;
  url: string | null;
};

/**
 * Entregas recientes de cualquier hito del proyecto, de la más nueva a la más
 * vieja — es "Actividad reciente" (S-05): no hace falta una tabla de eventos
 * propia, cada entrega ya es un evento ("fulano registró un avance"). Los
 * nombres van en una consulta aparte: `submissions.submitted_by` referencia
 * `auth.users`, no `profiles`.
 */
export async function getRecentProjectActivity(
  projectId: string,
  limit = 5,
): Promise<MilestoneActivity[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("submissions")
    .select(
      "id, url, created_at, submitted_by, milestone:milestones!inner ( titulo, project_id )",
    )
    .eq("milestone.project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getRecentProjectActivity]", error.message);
    return [];
  }

  const rows = data ?? [];
  const actorIds = Array.from(
    new Set(rows.map((r) => r.submitted_by).filter((id): id is string => !!id)),
  );

  const nombres = new Map<string, string | null>();
  if (actorIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, nombre")
      .in("id", actorIds);
    for (const p of profs ?? []) nombres.set(p.id, p.nombre);
  }

  return rows.map((r) => ({
    id: r.id,
    milestoneTitulo: r.milestone?.titulo ?? "",
    actorNombre: r.submitted_by ? (nombres.get(r.submitted_by) ?? null) : null,
    created_at: r.created_at,
    url: r.url,
  }));
}
