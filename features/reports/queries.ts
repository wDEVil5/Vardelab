import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils";

/**
 * Capa de datos de reportes (M7 + M22). Un reporte apunta a una entidad
 * (`target_type` + `target_id`) en vez de tener una FK fija, porque puede
 * referirse a distintas tablas (proyecto, perfil). La RLS
 * (`reports_select_own_or_moderator`) limita la lectura a quien reportó o a
 * moderador/admin; estas funciones son para el lado del staff.
 */

/**
 * Reportes abiertos o en revisión (todavía no resueltos), del más antiguo al
 * más reciente — la cola se atiende por orden de llegada.
 */
export async function getOpenReports() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select("id, target_type, target_id, motivo, status, created_at")
    .neq("status", "resuelto")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getOpenReports]", error.message);
    return [];
  }

  return data;
}

export type OpenReport = Awaited<ReturnType<typeof getOpenReports>>[number];

const REPORTS_SELECT =
  "id, target_type, target_id, motivo, descripcion, status, resolucion, created_at, reporter_id, escalado_admin, escalado_nota, escalado_at";

export const REPORTS_PAGE_SIZE = 20;

type ReportStatusFiltro = "abiertos" | "en_revision" | "resueltos" | "todos" | "escalados";

/**
 * Página de reportes para el panel de gestión (`/moderacion/reportes`),
 * filtrada por estado y paginada en SQL — reemplaza traer TODOS los reportes
 * históricos y filtrarlos en memoria. Además, al acotar a una página, la
 * página que la consume solo resuelve el destino (`getReportTarget`) de las
 * filas visibles en vez de hacerlo para cada reporte que existe en el
 * sistema — antes era un N+1 sin límite (una consulta extra por reporte).
 */
export async function getReportsPage(page: number, filtro: ReportStatusFiltro) {
  const supabase = await createClient();
  const from = Math.max(page - 1, 0) * REPORTS_PAGE_SIZE;
  const to = from + REPORTS_PAGE_SIZE - 1;

  let query = supabase
    .from("reports")
    .select(REPORTS_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filtro === "abiertos") query = query.eq("status", "abierto");
  else if (filtro === "en_revision") query = query.eq("status", "en_revision");
  else if (filtro === "resueltos") query = query.eq("status", "resuelto");
  else if (filtro === "escalados") query = query.eq("escalado_admin", true);

  const { data, error, count } = await query;

  if (error) {
    console.error("[getReportsPage]", error.message);
    return { reports: [], total: 0, pageSize: REPORTS_PAGE_SIZE };
  }

  return { reports: data ?? [], total: count ?? 0, pageSize: REPORTS_PAGE_SIZE };
}

/** Cuántos reportes hay por estado, para los KPIs y los contadores del filtro. */
export async function getReportCountsByStatus() {
  const supabase = await createClient();
  const estados = ["abierto", "en_revision", "resuelto"] as const;

  const [total, escalados, ...porEstado] = await Promise.all([
    supabase.from("reports").select("id", { count: "exact", head: true }),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("escalado_admin", true),
    ...estados.map((e) =>
      supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", e),
    ),
  ]);

  return {
    todos: total.count ?? 0,
    abiertos: porEstado[0]?.count ?? 0,
    en_revision: porEstado[1]?.count ?? 0,
    resueltos: porEstado[2]?.count ?? 0,
    escalados: escalados.count ?? 0,
  };
}

export type Report = Awaited<ReturnType<typeof getReportsPage>>["reports"][number];

/**
 * Reportes que el usuario actual presentó, del más reciente al más antiguo
 * (S-08, "Mis reportes"). La RLS `reports_select_own_or_moderator` ya limita a
 * los propios; el filtro por `reporter_id` es solo para no traer de más.
 */
export async function getMyReports() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("reports")
    .select("id, target_type, target_id, motivo, descripcion, status, resolucion, created_at")
    .eq("reporter_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getMyReports]", error.message);
    return [];
  }

  return data;
}

export type MyReport = Awaited<ReturnType<typeof getMyReports>>[number];

/** Un reporte por id, con su detalle completo. `null` si no existe o no se ve. */
export async function getReportById(id: string) {
  if (!isUuid(id)) return null;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(REPORTS_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getReportById]", error.message);
    return null;
  }

  return data;
}

export type ReportDetail = NonNullable<
  Awaited<ReturnType<typeof getReportById>>
>;

// Lo mínimo para mostrar a qué apunta un reporte: un título y un enlace. Cada
// `target_type` vive en una tabla distinta, así que se resuelve aparte (no hay
// FK fija — ver el comentario de M7).
export type ReportTarget = { label: string; href: string } | null;

/**
 * Resuelve el título/nombre de la entidad reportada, para mostrarlo en la cola
 * y en el detalle. Devuelve `null` si la entidad ya no existe (se borró) — el
 * reporte se mantiene, pero sin destino al que enlazar.
 */
export async function getReportTarget(
  targetType: string,
  targetId: string | null,
): Promise<ReportTarget> {
  if (!targetId) return null;
  const supabase = await createClient();

  if (targetType === "proyecto") {
    const { data } = await supabase
      .from("projects")
      .select("titulo")
      .eq("id", targetId)
      .maybeSingle();
    if (!data) return null;
    return { label: data.titulo, href: `/proyectos/${targetId}` };
  }

  if (targetType === "perfil") {
    const { data } = await supabase
      .from("profiles")
      .select("nombre")
      .eq("id", targetId)
      .maybeSingle();
    if (!data) return null;
    return { label: data.nombre ?? "Perfil", href: `/u/${targetId}` };
  }

  if (targetType === "organizacion") {
    const { data } = await supabase
      .from("organizations")
      .select("nombre")
      .eq("id", targetId)
      .maybeSingle();
    if (!data) return null;
    return { label: data.nombre, href: `/organizaciones/${targetId}` };
  }

  return null;
}

/**
 * Nombre de quien reportó, o `null` si no es legible (perfil privado y sin
 * relación con quien consulta — la RLS de `profiles` no da acceso amplio a
 * moderador/admin). El detalle del reporte cae a "Usuario" en ese caso.
 */
export async function getReporterName(reporterId: string | null) {
  if (!reporterId) return null;
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("nombre")
    .eq("id", reporterId)
    .maybeSingle();

  return data?.nombre ?? null;
}
