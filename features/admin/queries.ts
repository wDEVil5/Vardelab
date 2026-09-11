import { createAdminClient } from "@/lib/supabase/admin";

const ESTADOS_PROYECTO = [
  "borrador",
  "en_revision",
  "publicado",
  "seleccion",
  "activo",
  "revision_final",
  "completado",
  "suspendido",
  "cancelado",
] as const;

const ETIQUETA_ESTADO: Record<(typeof ESTADOS_PROYECTO)[number], string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  publicado: "Publicado",
  seleccion: "Selección",
  activo: "Activo",
  revision_final: "Revisión final",
  completado: "Completado",
  suspendido: "Suspendido",
  cancelado: "Cancelado",
};

/** Meta orientativa del piloto (PRD §15): 7+ proyectos completados. */
const META_NORTH_STAR = 7;

/**
 * Métricas agregadas del piloto (D-01, RF-14). Usa el cliente de
 * `service_role` porque varias tablas (`teams`, `team_members`) no dejan ver
 * filas ajenas a un admin por RLS (solo al gestor/integrante) — el panel
 * admin necesita el agregado completo, no solo lo propio. Cuenta en memoria
 * sobre columnas livianas: a escala de piloto (decenas de filas) es simple y
 * suficiente; con volumen real esto pasaría a una vista o función SQL.
 */
export async function getPilotMetrics() {
  const supabase = createAdminClient();

  const [
    { data: proyectos },
    { data: aplicaciones },
    { data: equipos },
    { data: hitos },
    { data: evidencias },
    { data: reportes },
  ] = await Promise.all([
    supabase.from("projects").select("status"),
    supabase.from("applications").select("status"),
    supabase.from("teams").select("id"),
    supabase.from("milestones").select("estado"),
    supabase.from("portfolio_items").select("id"),
    supabase.from("reports").select("status"),
  ]);

  const porEstado = Object.fromEntries(
    ESTADOS_PROYECTO.map((estado) => [
      estado,
      (proyectos ?? []).filter((p) => p.status === estado).length,
    ]),
  ) as Record<(typeof ESTADOS_PROYECTO)[number], number>;

  const totalProyectos = proyectos?.length ?? 0;
  const completados = porEstado.completado;
  const publicados = totalProyectos - porEstado.borrador - porEstado.en_revision;

  const totalAplicaciones = aplicaciones?.length ?? 0;
  const aceptadas = (aplicaciones ?? []).filter((a) => a.status === "aceptada").length;

  const totalHitos = hitos?.length ?? 0;
  const hitosAprobados = (hitos ?? []).filter((h) => h.estado === "aprobado").length;

  const reportesAbiertos = (reportes ?? []).filter((r) => r.status !== "resuelto").length;
  const reportesResueltos = (reportes ?? []).filter((r) => r.status === "resuelto").length;

  return {
    totalProyectos,
    publicados,
    completados,
    equiposFormados: equipos?.length ?? 0,
    evidenciasPortafolio: evidencias?.length ?? 0,
    porEstado: ESTADOS_PROYECTO.map((estado) => ({
      estado,
      etiqueta: ETIQUETA_ESTADO[estado],
      total: porEstado[estado],
    })).filter((e) => e.total > 0),
    postulaciones: { total: totalAplicaciones, aceptadas },
    hitos: { total: totalHitos, aprobados: hitosAprobados },
    reportes: { abiertos: reportesAbiertos, resueltos: reportesResueltos },
    northStar: {
      completados,
      meta: META_NORTH_STAR,
      enObjetivo: completados >= META_NORTH_STAR,
    },
  };
}

export type PilotMetrics = Awaited<ReturnType<typeof getPilotMetrics>>;
