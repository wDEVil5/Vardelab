import { createClient } from "@/lib/supabase/server";
import { getMyOrgIds } from "@/features/organizations/queries";
import { isUuid } from "@/lib/utils";

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
  const orgIds = await getMyOrgIds();
  if (orgIds.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("milestones")
    .select(
      `
      id,
      titulo,
      fecha_limite,
      estado,
      project:projects!inner ( id, titulo, org_id )
    `,
    )
    .in("project.org_id", orgIds)
    .not("fecha_limite", "is", null)
    .in("estado", ["pendiente", "en_progreso"])
    // Cancelar un proyecto (M60) no toca sus hitos — sin este filtro, un hito
    // `pendiente` de un proyecto ya cancelado (o completado, defensivamente)
    // seguía apareciendo como "próximo a vencer" para siempre en el inicio.
    .not("project.status", "in", "(cancelado,completado)")
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

// El bucket `submission-files` (M48) es privado: `archivo_url` en la fila es
// solo la ruta del objeto, no algo que se pueda enlazar directo. Acá se
// reemplaza por una URL firmada (vence en 1h, se genera de nuevo en cada
// carga de página) antes de devolver los datos — así ninguna pantalla que
// consuma estas dos queries necesita saber que el archivo vive en un bucket
// privado, solo recibe un link que funciona.
async function firmarArchivosDeEntregas<
  T extends { submissions: { archivo_url: string | null }[] | null },
>(supabase: Awaited<ReturnType<typeof createClient>>, hitos: T[]): Promise<T[]> {
  const rutas = hitos.flatMap((h) =>
    (h.submissions ?? [])
      .map((s) => s.archivo_url)
      .filter((u): u is string => Boolean(u)),
  );
  if (rutas.length === 0) return hitos;

  const { data } = await supabase.storage
    .from("submission-files")
    .createSignedUrls(rutas, 3600);
  const firmadas = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));

  return hitos.map((h) => ({
    ...h,
    submissions: (h.submissions ?? []).map((s) => ({
      ...s,
      archivo_url: s.archivo_url ? (firmadas.get(s.archivo_url) ?? null) : null,
    })),
  }));
}

/**
 * Un hito con sus entregas anidadas, para la pantalla de entrega (E-06). Antes
 * esa pantalla usaba `getMilestoneById` (sin entregas) y siempre mostraba un
 * formulario en blanco, aunque el hito ya tuviera una entrega esperando
 * revisión — el estudiante no tenía forma de ver qué había mandado antes.
 * Mismo shape que `getMilestonesWithSubmissions` (uno de sus elementos), para
 * poder reusar `MilestoneSubmissions` en las dos pantallas.
 */
export async function getMilestoneWithSubmissionsById(id: string) {
  if (!isUuid(id)) return null;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("milestones")
    .select(
      `
      id, titulo, descripcion, fecha_limite, orden, estado, project_id,
      submissions ( id, url, nota, archivo_url, submitted_by, created_at )
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getMilestoneWithSubmissionsById]", error.message);
    return null;
  }
  if (!data) return null;

  const [firmado] = await firmarArchivosDeEntregas(supabase, [data]);
  return firmado;
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
      submissions ( id, url, nota, archivo_url, submitted_by, created_at )
    `,
    )
    .eq("project_id", projectId)
    .order("orden")
    .order("created_at");

  if (error) {
    console.error("[getMilestonesWithSubmissions]", error.message);
    return [];
  }

  return firmarArchivosDeEntregas(supabase, data ?? []);
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
