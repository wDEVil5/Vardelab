import { createClient } from "@/lib/supabase/server";

/**
 * Capa de datos de leads (lado del staff). La RLS `leads_select_staff` (M17)
 * limita la lectura a moderador/admin; si el usuario no tiene ese rol, Supabase
 * devuelve simplemente cero filas (no un error).
 */

/**
 * Leads en estado `nuevo`, del más reciente al más antiguo. Es la bandeja de
 * entrada: lo que todavía nadie gestionó.
 */
export async function getPendingLeads() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("id, tipo, nombre, email, organizacion, mensaje, created_at")
    .eq("estado", "nuevo")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getPendingLeads]", error.message);
    return [];
  }

  return data;
}

export type PendingLead = Awaited<ReturnType<typeof getPendingLeads>>[number];

const LEADS_SELECT = "id, tipo, nombre, email, organizacion, mensaje, estado, created_at";

export const LEADS_PAGE_SIZE = 20;

type LeadEstadoFiltro = "nuevo" | "contactado" | "descartado" | "todos";

/**
 * Página de leads para el panel de gestión (`/leads`), filtrada por estado y
 * paginada en SQL (`.range()`) — reemplaza traer TODOS los leads de siempre
 * y filtrarlos en memoria, que con la captación acumulada de meses se vuelve
 * una lista interminable (mismo hallazgo que en proyectos/organizaciones del
 * admin). No hace falta una función/migración aparte: al ser un solo filtro
 * exacto sobre una tabla chica, `.range()` + `.eq()` directo alcanza.
 */
export async function getLeadsPage(page: number, estado: LeadEstadoFiltro) {
  const supabase = await createClient();
  const from = Math.max(page - 1, 0) * LEADS_PAGE_SIZE;
  const to = from + LEADS_PAGE_SIZE - 1;

  let query = supabase
    .from("leads")
    .select(LEADS_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (estado !== "todos") query = query.eq("estado", estado);

  const { data, error, count } = await query;

  if (error) {
    console.error("[getLeadsPage]", error.message);
    return { leads: [], total: 0, pageSize: LEADS_PAGE_SIZE };
  }

  return { leads: data ?? [], total: count ?? 0, pageSize: LEADS_PAGE_SIZE };
}

/**
 * Cuántos leads hay por estado, para los contadores de los filtros — sin
 * traer las filas. Independiente del filtro/página actual de la tabla.
 */
export async function getLeadCountsByEstado() {
  const supabase = await createClient();
  const estados = ["nuevo", "contactado", "descartado"] as const;

  const [total, ...porEstado] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }),
    ...estados.map((e) =>
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("estado", e),
    ),
  ]);

  const conteos: Record<string, number> = { todos: total.count ?? 0 };
  estados.forEach((e, i) => {
    conteos[e] = porEstado[i]?.count ?? 0;
  });
  return conteos;
}

export type Lead = Awaited<ReturnType<typeof getLeadsPage>>["leads"][number];
