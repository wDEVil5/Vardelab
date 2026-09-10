import { createClient } from "@/lib/supabase/server";

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

/**
 * Todos los reportes (cualquier estado), del más reciente al más antiguo. Para
 * el panel de gestión, que filtra por estado en la interfaz.
 */
export async function getAllReports() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, target_type, target_id, motivo, descripcion, status, resolucion, created_at, reporter_id",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getAllReports]", error.message);
    return [];
  }

  return data;
}

export type Report = Awaited<ReturnType<typeof getAllReports>>[number];

/** Un reporte por id, con su detalle completo. `null` si no existe o no se ve. */
export async function getReportById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, target_type, target_id, motivo, descripcion, status, resolucion, created_at, reporter_id",
    )
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
