import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

/** Roles en el orden en que se muestran (más "alto" primero). */
const ORDEN_ROLES = ["admin", "moderador", "mentor", "patrocinador", "estudiante"] as const;

/** `banned_until` en el futuro = cuenta suspendida (GoTrue fija ~100 años al banear). */
function estaSuspendido(bannedUntil: string | null | undefined): boolean {
  if (!bannedUntil) return false;
  return new Date(bannedUntil).getTime() > Date.now();
}

/**
 * Usuarios del piloto para el panel de administración (D-03, RF-16). El
 * correo solo vive en `auth.users` (esquema `auth`, no expuesto por la API de
 * datos), así que hace falta el cliente `service_role` para listarlo — junto
 * con `profiles` (nombre) y `user_roles` (rol), cruzados en memoria porque
 * `applicant`/`user_id` en estas tablas apunta a `auth.users`, no a una tabla
 * con la que PostgREST pueda anidar el `select`.
 *
 * `auth.admin.listUsers` pagina de a 1000; a escala de piloto alcanza con una
 * página. Con más usuarios habría que iterar páginas.
 */
export async function getUsersForAdmin() {
  const supabase = createAdminClient();

  const [{ data: authData, error: authError }, { data: perfiles }, { data: roles }] =
    await Promise.all([
      supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabase.from("profiles").select("id, nombre, carrera"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

  if (authError) {
    console.error("[getUsersForAdmin]", authError.message);
    return [];
  }

  const perfilPorId = new Map((perfiles ?? []).map((p) => [p.id, p]));
  const rolesPorUsuario = new Map<string, string[]>();
  for (const r of roles ?? []) {
    const lista = rolesPorUsuario.get(r.user_id) ?? [];
    lista.push(r.role);
    rolesPorUsuario.set(r.user_id, lista);
  }

  return authData.users
    .map((u) => {
      const perfil = perfilPorId.get(u.id);
      const rolesUsuario = rolesPorUsuario.get(u.id) ?? [];
      const rolPrincipal =
        ORDEN_ROLES.find((r) => rolesUsuario.includes(r)) ?? null;
      return {
        id: u.id,
        email: u.email ?? "(sin correo)",
        nombre: perfil?.nombre ?? "(sin nombre)",
        carrera: perfil?.carrera ?? null,
        roles: rolesUsuario,
        rolPrincipal,
        suspendido: estaSuspendido(u.banned_until),
        creadoEl: u.created_at,
      };
    })
    .sort((a, b) => (a.creadoEl < b.creadoEl ? 1 : -1));
}

export type AdminUserRow = Awaited<ReturnType<typeof getUsersForAdmin>>[number];

const ROL_LABEL_CORTO: Record<string, string> = {
  admin: "Admin",
  moderador: "Moderador",
  mentor: "Mentor",
  patrocinador: "Patrocinador",
  estudiante: "Estudiante",
};

/**
 * Registro de auditoría (D-04, RF-17). `audit_logs` ya es legible por
 * moderador/admin vía RLS (`audit_logs_select_moderator`), así que alcanza el
 * cliente normal — a diferencia de los usuarios, acá no hace falta el cliente
 * `service_role`. `actor_id` y, en las acciones de hoy, `entidad_id` apuntan a
 * `auth.users` (no a `profiles`), así que ambos nombres se resuelven con
 * consultas aparte y se cruzan en memoria (misma limitación de PostgREST que
 * en `getProjectApplications`). Si en el futuro se audita otro tipo de
 * entidad (un proyecto, un reporte), `entidad_id` no va a encontrar perfil y
 * cae al identificador crudo — no se rompe, solo pierde el nombre.
 */
export async function getAuditLog() {
  const supabase = await createClient();

  const { data: eventos, error } = await supabase
    .from("audit_logs")
    .select("id, actor_id, accion, entidad, entidad_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[getAuditLog]", error.message);
    return [];
  }

  const personaIds = [
    ...new Set(
      (eventos ?? []).flatMap((e) => [e.actor_id, e.entidad_id]).filter(Boolean),
    ),
  ] as string[];

  const nombrePorId = new Map<string, string>();
  const rolPorId = new Map<string, string>();
  if (personaIds.length > 0) {
    const [{ data: perfiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, nombre").in("id", personaIds),
      supabase.from("user_roles").select("user_id, role").in("user_id", personaIds),
    ]);
    for (const p of perfiles ?? []) {
      if (p.nombre) nombrePorId.set(p.id, p.nombre);
    }
    const rolesPorUsuario = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const lista = rolesPorUsuario.get(r.user_id) ?? [];
      lista.push(r.role);
      rolesPorUsuario.set(r.user_id, lista);
    }
    for (const [userId, lista] of rolesPorUsuario) {
      const principal = ORDEN_ROLES.find((r) => lista.includes(r));
      if (principal) rolPorId.set(userId, ROL_LABEL_CORTO[principal]);
    }
  }

  return (eventos ?? []).map((e) => ({
    ...e,
    actorNombre: e.actor_id ? (nombrePorId.get(e.actor_id) ?? "(usuario eliminado)") : "(sistema)",
    actorRol: e.actor_id ? (rolPorId.get(e.actor_id) ?? null) : null,
    entidadNombre: e.entidad_id ? (nombrePorId.get(e.entidad_id) ?? null) : null,
  }));
}

export type AuditLogEntry = Awaited<ReturnType<typeof getAuditLog>>[number];
