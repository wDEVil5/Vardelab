import { createClient } from "@/lib/supabase/server";

/**
 * Datos del inicio del estudiante (E-00). Todo se resuelve para el usuario en
 * sesión bajo su RLS. Reúne: completitud del perfil, resumen de postulaciones,
 * proyecto activo (equipo del que es miembro, con progreso por hitos) y acciones
 * pendientes (hitos por trabajar en ese proyecto).
 */
export async function getStudentDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [perfil, postulaciones, activo] = await Promise.all([
    perfilCompleto(supabase, user.id),
    resumenPostulaciones(supabase, user.id),
    proyectoActivo(supabase, user.id),
  ]);

  return {
    perfilCompleto: perfil,
    postulaciones,
    proyectoActivo: activo?.proyecto ?? null,
    accionesPendientes: activo?.accionesPendientes ?? 0,
  };
}

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

// % de campos clave del perfil cargados (incluye tener ≥1 habilidad).
async function perfilCompleto(
  supabase: SupabaseServer,
  userId: string,
): Promise<number> {
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

  const senales = [
    profile?.nombre,
    profile?.carrera,
    profile?.semestre != null ? "x" : null,
    profile?.bio,
    profile?.avatar_url,
    (skills ?? 0) > 0 ? "x" : null,
  ];
  const llenos = senales.filter(Boolean).length;
  return Math.round((llenos / senales.length) * 100);
}

// Total de postulaciones y desglose por estado (aceptadas / en revisión).
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
  };
}

const CERRADOS = ["completado", "cancelado", "suspendido"];

// Proyecto en curso del estudiante (miembro de equipo), con progreso por hitos.
async function proyectoActivo(supabase: SupabaseServer, userId: string) {
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team:teams!inner ( id, project:projects!inner ( id, titulo, status ) )")
    .eq("user_id", userId);

  // Primer equipo cuyo proyecto sigue en curso.
  const activa = (memberships ?? []).find((m) => {
    const estado = m.team?.project?.status ?? "";
    return m.team?.project && !CERRADOS.includes(estado);
  });
  if (!activa?.team?.project) return null;

  const teamId = activa.team.id;
  const proj = activa.team.project;

  const [{ data: hitos }, { count: equipo }] = await Promise.all([
    supabase
      .from("milestones")
      .select("estado, titulo, orden")
      .eq("project_id", proj.id)
      .order("orden", { ascending: true }),
    supabase
      .from("team_members")
      .select("user_id", { count: "exact", head: true })
      .eq("team_id", teamId),
  ]);

  const lista = hitos ?? [];
  const total = lista.length;
  const aprobados = lista.filter((h) => h.estado === "aprobado").length;
  const proximo = lista.find((h) => h.estado !== "aprobado")?.titulo ?? null;
  const accionesPendientes = lista.filter(
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
      proximoHito: proximo,
    },
    accionesPendientes,
  };
}

export type StudentDashboard = NonNullable<
  Awaited<ReturnType<typeof getStudentDashboard>>
>;
