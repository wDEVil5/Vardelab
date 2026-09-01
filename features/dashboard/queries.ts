import { createClient } from "@/lib/supabase/server";
import { getMyPortfolioItems } from "@/features/portfolio/queries";

/**
 * Datos del inicio del estudiante (E-00). Todo se resuelve para el usuario en
 * sesión bajo su RLS. Reúne KPIs (perfil, postulaciones, acciones, portafolio),
 * el proyecto activo con su línea de hitos, y qué falta para completar el perfil.
 */
export async function getStudentDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [perfil, postulaciones, activo, portafolioCount] = await Promise.all([
    perfilCompleto(supabase, user.id),
    resumenPostulaciones(supabase, user.id),
    proyectoActivo(supabase, user.id),
    getMyPortfolioItems()
      .then((items) => items.length)
      .catch(() => 0),
  ]);

  return {
    perfil,
    postulaciones,
    portafolioCount,
    proyectoActivo: activo?.proyecto ?? null,
    accionesPendientes: activo?.accionesPendientes ?? 0,
  };
}

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

// Completitud del perfil: % y qué campos clave faltan (para una acción concreta).
async function perfilCompleto(supabase: SupabaseServer, userId: string) {
  const [{ data: profile }, { count: skills }] = await Promise.all([
    supabase
      .from("profiles")
      .select("nombre, carrera, semestre, bio, avatar_url")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("profile_skills")
      .select("skill_id", { count: "exact", head: true })
      .eq("profile_id", userId),
  ]);

  // Cada señal: [presente?, etiqueta si falta].
  const campos: [boolean, string][] = [
    [Boolean(profile?.nombre), "Nombre"],
    [Boolean(profile?.carrera), "Carrera"],
    [profile?.semestre != null, "Semestre"],
    [Boolean(profile?.bio), "Presentación"],
    [Boolean(profile?.avatar_url), "Foto de perfil"],
    [(skills ?? 0) > 0, "Habilidades"],
  ];
  const llenos = campos.filter(([ok]) => ok).length;
  return {
    pct: Math.round((llenos / campos.length) * 100),
    faltan: campos.filter(([ok]) => !ok).map(([, label]) => label),
  };
}

// Total de postulaciones y desglose por estado.
async function resumenPostulaciones(supabase: SupabaseServer, userId: string) {
  const { data } = await supabase
    .from("applications")
    .select("status")
    .eq("applicant_id", userId);

  const lista = data ?? [];
  return {
    total: lista.length,
    aceptadas: lista.filter((a) => a.status === "aceptada").length,
    enRevision: lista.filter((a) => a.status === "enviada").length,
    rechazadas: lista.filter((a) => a.status === "rechazada").length,
  };
}

const CERRADOS = ["completado", "cancelado", "suspendido"];

export type HitoResumen = {
  id: string;
  titulo: string;
  estado: string | null;
  fechaLimite: string | null;
};

// Proyecto en curso del estudiante (miembro de equipo), con su línea de hitos.
async function proyectoActivo(supabase: SupabaseServer, userId: string) {
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team:teams!inner ( id, project:projects!inner ( id, titulo, status ) )")
    .eq("user_id", userId);

  const activa = (memberships ?? []).find((m) => {
    const estado = m.team?.project?.status ?? "";
    return m.team?.project && !CERRADOS.includes(estado);
  });
  if (!activa?.team?.project) return null;

  const teamId = activa.team.id;
  const proj = activa.team.project;

  const [{ data: hitosRaw }, { count: equipo }] = await Promise.all([
    supabase
      .from("milestones")
      .select("id, titulo, estado, fecha_limite, orden")
      .eq("project_id", proj.id)
      .order("orden", { ascending: true }),
    supabase
      .from("team_members")
      .select("user_id", { count: "exact", head: true })
      .eq("team_id", teamId),
  ]);

  const hitos: HitoResumen[] = (hitosRaw ?? []).map((h) => ({
    id: h.id,
    titulo: h.titulo,
    estado: h.estado,
    fechaLimite: h.fecha_limite,
  }));
  const total = hitos.length;
  const aprobados = hitos.filter((h) => h.estado === "aprobado").length;
  const siguiente = hitos.find((h) => h.estado !== "aprobado") ?? null;
  const accionesPendientes = hitos.filter(
    (h) => h.estado === "pendiente" || h.estado === "en_progreso",
  ).length;

  return {
    proyecto: {
      id: proj.id,
      titulo: proj.titulo,
      equipoTamano: equipo ?? 0,
      progreso: total > 0 ? Math.round((aprobados / total) * 100) : 0,
      hitosAprobados: aprobados,
      hitosTotal: total,
      proximoHito: siguiente?.titulo ?? null,
      proximaFecha: siguiente?.fechaLimite ?? null,
      hitos,
    },
    accionesPendientes,
  };
}

export type StudentDashboard = NonNullable<
  Awaited<ReturnType<typeof getStudentDashboard>>
>;
