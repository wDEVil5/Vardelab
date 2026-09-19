import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ESTADOS_PROYECTO, ETIQUETA_ESTADO } from "@/features/admin/project-status";
import { isUuid } from "@/lib/utils";

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
  // Lista explícita de estados en vez de "todo lo que no es borrador/en_revisión":
  // esa resta también contaba `suspendido`/`cancelado` como "publicados", que no
  // corresponde — un proyecto cancelado no sigue publicado. Hoy es inofensivo
  // porque nada en la app puede llevar un proyecto a esos dos estados, pero la
  // lista explícita no depende de que eso siga siendo cierto.
  const publicados =
    porEstado.publicado +
    porEstado.seleccion +
    porEstado.activo +
    porEstado.revision_final +
    porEstado.completado;

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
 * `auth.admin.listUsers` pagina de a 1000 como máximo por request — con más
 * de 1000 cuentas (hallazgo de la prueba de carga: 3.005 usuarios sintéticos)
 * una sola llamada truncaba en silencio, sin error, mostrando/contando solo
 * las primeras 1000. Se itera hasta agotar las páginas.
 */
export async function getUsersForAdmin() {
  const supabase = createAdminClient();

  // Mapa por id, no arreglo: `listUsers` pagina por offset sobre un orden que
  // puede tener empates (varias cuentas con el mismo `created_at` exacto, ej.
  // una siembra masiva) — sin una clave de desempate estable, el mismo id
  // puede repetirse entre páginas. Deduplicar acá evita esa fila duplicada
  // (y el "two children with the same key" que React tira con ids repetidos).
  const authUsersPorId = new Map<string, User>();
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error("[getUsersForAdmin]", error.message);
      return [];
    }
    for (const u of data.users) authUsersPorId.set(u.id, u);
    if (data.users.length < 1000) break;
  }
  const authUsers = Array.from(authUsersPorId.values());

  const [{ data: perfiles }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("id, nombre, carrera, visibility"),
    supabase.from("user_roles").select("user_id, role"),
  ]);

  const perfilPorId = new Map((perfiles ?? []).map((p) => [p.id, p]));
  const rolesPorUsuario = new Map<string, string[]>();
  for (const r of roles ?? []) {
    const lista = rolesPorUsuario.get(r.user_id) ?? [];
    lista.push(r.role);
    rolesPorUsuario.set(r.user_id, lista);
  }

  return authUsers
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
        perfilPublico: perfil?.visibility === "publico",
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

  // `entidad_id` no siempre es una persona: las acciones de catálogo
  // (`catalogo_editado`) apuntan a una fila de `skills`, y las de verificación
  // (`organizacion_verificada`/`organizacion_rechazada`, M62) a una fila de
  // `organizations`. Se resuelven aparte (los ids no se pisan entre tablas) y
  // se suman al mismo mapa de nombres.
  const skillIds = [
    ...new Set((eventos ?? []).filter((e) => e.entidad === "skills").map((e) => e.entidad_id)),
  ].filter(Boolean) as string[];
  const orgIds = [
    ...new Set(
      (eventos ?? []).filter((e) => e.entidad === "organizations").map((e) => e.entidad_id),
    ),
  ].filter(Boolean) as string[];

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
  if (skillIds.length > 0) {
    const { data: skills } = await supabase.from("skills").select("id, nombre").in("id", skillIds);
    for (const s of skills ?? []) {
      nombrePorId.set(s.id, `Habilidad: ${s.nombre}`);
    }
  }
  if (orgIds.length > 0) {
    const { data: orgs } = await supabase.from("organizations").select("id, nombre").in("id", orgIds);
    for (const o of orgs ?? []) {
      nombrePorId.set(o.id, o.nombre);
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

/**
 * Catálogo de habilidades (D-02, deseable). Usa `service_role`:
 * `profile_skills` no tiene una regla de RLS que deje a un admin ver filas
 * ajenas (solo el propio perfil o uno público), así que con el cliente normal
 * el conteo de "perfiles" saldría subcontado. `activo=false` no borra la
 * habilidad — `profile_skills` la referencia con `on delete restrict` — así
 * que las relaciones históricas quedan intactas. "Perfiles" cuenta solo
 * `profile_skills` (cuántos estudiantes la cargaron); no incluye
 * `project_role_skills` (habilidades exigidas por un rol de proyecto), que es
 * un uso distinto y no lo que el mockup mostraba.
 */
export async function getSkillsCatalog() {
  const supabase = createAdminClient();

  const [{ data: skills }, { data: enPerfiles }] = await Promise.all([
    supabase.from("skills").select("id, nombre, categoria, activo").order("nombre"),
    supabase.from("profile_skills").select("skill_id"),
  ]);

  const perfilesPorSkill = new Map<string, number>();
  for (const fila of enPerfiles ?? []) {
    perfilesPorSkill.set(fila.skill_id, (perfilesPorSkill.get(fila.skill_id) ?? 0) + 1);
  }

  return (skills ?? []).map((s) => ({
    ...s,
    perfiles: perfilesPorSkill.get(s.id) ?? 0,
  }));
}

export type SkillCatalogRow = Awaited<ReturnType<typeof getSkillsCatalog>>[number];

export const MODALIDAD_LABEL: Record<string, string> = {
  presencial: "Presencial",
  remoto: "Remoto",
  hibrido: "Híbrido",
};

/**
 * Uso de las modalidades de proyecto (D-02, pestaña "Modalidades"). A
 * diferencia de habilidades, `modalidad` es un `enum` de Postgres, no una
 * tabla: son valores fijos del esquema, no se pueden agregar/desactivar desde
 * la UI sin una migración. Esta vista es informativa, no editable.
 */
export async function getModalidadUsage() {
  const supabase = await createClient();

  const { data: proyectos, error } = await supabase.from("projects").select("modalidad");
  if (error) {
    console.error("[getModalidadUsage]", error.message);
    return [];
  }

  const conteo = new Map<string, number>();
  for (const p of proyectos ?? []) {
    const clave = p.modalidad ?? "sin_definir";
    conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
  }

  return [...conteo.entries()].map(([valor, total]) => ({
    valor,
    etiqueta: MODALIDAD_LABEL[valor] ?? "Sin definir",
    total,
  }));
}

export type ModalidadUsage = Awaited<ReturnType<typeof getModalidadUsage>>[number];

/**
 * Configuración del piloto (D-05, deseable). Fila única (`id = true`, M24).
 * Usa el cliente normal: la RLS ya deja pasar a un admin.
 */
export async function getPilotConfig() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pilot_config")
    .select("*")
    .eq("id", true)
    .single();

  if (error || !data) {
    console.error("[getPilotConfig]", error?.message);
    return null;
  }

  return data;
}

export type PilotConfig = NonNullable<Awaited<ReturnType<typeof getPilotConfig>>>;

/**
 * Últimos cambios de configuración, para la tarjeta "Gobernanza y
 * trazabilidad" de `/admin/configuracion`. En vez de guardar el historial en
 * `pilot_config` misma (que solo tiene espacio para un `updated_by`/
 * `updated_at`), se lee de `audit_logs` — que ya registra cada guardado con
 * actor y campos modificados (`updatePilotConfig`) — con un `limit` para que
 * la tarjeta no crezca sin control a medida que se acumulan meses de cambios;
 * `masDisponibles` le dice a la UI si hace falta un link a "ver todo" en
 * `/admin/auditoria` en vez de listar cientos de filas ahí mismo.
 */
export async function getConfigChangeHistory(limit = 3) {
  const supabase = await createClient();

  const { data: eventos, error } = await supabase
    .from("audit_logs")
    .select("id, actor_id, metadata, created_at")
    .eq("accion", "configuracion_actualizada")
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (error) {
    console.error("[getConfigChangeHistory]", error.message);
    return { cambios: [], masDisponibles: false };
  }

  const actorIds = [...new Set((eventos ?? []).map((e) => e.actor_id).filter(Boolean))] as string[];
  const nombrePorId = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: perfiles } = await supabase
      .from("profiles")
      .select("id, nombre")
      .in("id", actorIds);
    for (const p of perfiles ?? []) {
      if (p.nombre) nombrePorId.set(p.id, p.nombre);
    }
  }

  const masDisponibles = (eventos ?? []).length > limit;
  const cambios = (eventos ?? []).slice(0, limit).map((e) => ({
    id: e.id,
    actorNombre: e.actor_id ? (nombrePorId.get(e.actor_id) ?? "(usuario eliminado)") : "(sistema)",
    campos: Array.isArray((e.metadata as { campos?: unknown })?.campos)
      ? ((e.metadata as { campos: string[] }).campos)
      : [],
    createdAt: e.created_at,
  }));

  return { cambios, masDisponibles };
}

export type ConfigChangeHistory = Awaited<ReturnType<typeof getConfigChangeHistory>>;

/**
 * Todos los proyectos del piloto, para `/admin/proyectos`. Hallazgo de la
 * revisión de métricas: ninguna pantalla de admin listaba proyectos, aunque
 * la RLS ya le daba acceso completo — `projects_select_published_or_manager`
 * incluye `has_role(auth.uid(), 'admin')` desde M3. Cliente normal: no hace
 * falta `service_role`, la RLS ya alcanza.
 */
// La tabla llena el alto disponible con scroll interno propio (ver
// `ProjectsTable`/`admin/proyectos/page.tsx`), así que un tamaño generoso no
// rompe el layout: en pantallas altas se ven más filas sin scrollear, en
// pantallas bajas scrollea dentro de su caja sin mover la paginación.
export const ADMIN_PROJECTS_PAGE_SIZE = 30;

/**
 * Página de la lista de proyectos del piloto para el admin (D-01), con
 * búsqueda (título u organización) y filtro de estado resueltos en SQL
 * (`admin_projects_page`, M79) — reemplaza traer TODOS los proyectos y
 * filtrar/renderizar la tabla completa en el cliente, que con volumen real
 * se vuelve una lista interminable (ver prueba de carga, BACKEND.md).
 */
export async function getProjectsForAdminPage(
  page: number,
  filters: { q?: string; status?: string },
) {
  const supabase = await createClient();
  const offset = Math.max(page - 1, 0) * ADMIN_PROJECTS_PAGE_SIZE;

  const { data: matches, error: matchError } = await supabase.rpc(
    "admin_projects_page",
    {
      _q: filters.q?.trim() || undefined,
      _status: filters.status || undefined,
      _limit: ADMIN_PROJECTS_PAGE_SIZE,
      _offset: offset,
    },
  );

  if (matchError) {
    console.error("[admin_projects_page]", matchError.message);
    return { proyectos: [], total: 0, pageSize: ADMIN_PROJECTS_PAGE_SIZE };
  }

  const orderedIds = (matches ?? []).map((m) => m.id);
  if (orderedIds.length === 0) {
    // Igual que en el catálogo público (M78): el total viaja en las filas
    // devueltas, así que una página fuera de rango (0 filas) necesita una
    // segunda consulta liviana para no reportar "0 resultados" de más.
    if (offset > 0) {
      const { data: primera } = await supabase.rpc("admin_projects_page", {
        _q: filters.q?.trim() || undefined,
        _status: filters.status || undefined,
        _limit: 1,
        _offset: 0,
      });
      return {
        proyectos: [],
        total: primera?.[0] ? Number(primera[0].total_count) : 0,
        pageSize: ADMIN_PROJECTS_PAGE_SIZE,
      };
    }
    return { proyectos: [], total: 0, pageSize: ADMIN_PROJECTS_PAGE_SIZE };
  }

  const total = Number(matches?.[0]?.total_count ?? 0);

  const { data, error } = await supabase
    .from("projects")
    .select("id, titulo, status, created_at, org:organizations ( nombre )")
    .in("id", orderedIds);

  if (error) {
    console.error("[getProjectsForAdminPage]", error.message);
    return { proyectos: [], total: 0, pageSize: ADMIN_PROJECTS_PAGE_SIZE };
  }

  const porId = new Map((data ?? []).map((p) => [p.id, p]));
  const proyectos = orderedIds
    .map((id) => porId.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({
      id: p.id,
      titulo: p.titulo,
      status: p.status,
      etiquetaEstado:
        ETIQUETA_ESTADO[p.status as (typeof ESTADOS_PROYECTO)[number]] ?? p.status,
      orgNombre: p.org?.nombre ?? "(sin organización)",
      createdAt: p.created_at,
    }));

  return { proyectos, total, pageSize: ADMIN_PROJECTS_PAGE_SIZE };
}

export type AdminProjectRow = Awaited<
  ReturnType<typeof getProjectsForAdminPage>
>["proyectos"][number];

/**
 * Detalle de un proyecto para `/admin/proyectos/[id]`: solo lectura + acceso
 * a cancelarlo. A diferencia de `getManagedProject` (features/projects/queries.ts),
 * no filtra primero por las organizaciones propias de quien consulta — un
 * admin no gestiona ninguna organización, así que ese filtro devolvería
 * `null` siempre. Acá se confía por completo en la RLS, que ya lo permite.
 *
 * Trae el proyecto completo (no el subconjunto que usa `getManagedProject`
 * para su propio panel): el admin necesita ver todo lo que el gestor cargó
 * (problema/alcance/entregable/expectativas, dedicación, comentario de
 * moderación) para poder decidir con contexto real, no solo un resumen.
 * `fecha_inicio`/`fecha_fin`/`descripcion` están en el esquema pero ningún
 * formulario de la app los escribe todavía — se traen igual para no ocultar
 * nada, y quedan en "—" en la práctica.
 */
export async function getProjectDetailForAdmin(id: string) {
  if (!isUuid(id)) return null;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `
      id, titulo, resumen, descripcion, problema, alcance, entregable, expectativas,
      status, modalidad, duracion_semanas, dedicacion_semanal,
      fecha_inicio, fecha_fin, comentario_moderacion, respuesta_patrocinador,
      created_at, revisado_at, created_by,
      org:organizations ( id, nombre ),
      roles:project_roles (
        id, nombre, descripcion, cupos, horas_semanales,
        skills:project_role_skills (
          nivel_minimo,
          skill:skills ( id, nombre )
        )
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getProjectDetailForAdmin]", error.message);
    return null;
  }
  if (!project) return null;

  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("project_id", id)
    .maybeSingle();

  let integrantes: { id: string; nombre: string; rol: string | null; avatarUrl: string | null }[] = [];
  if (team) {
    const { data: members } = await supabase
      .from("team_members")
      .select("user_id, rol:project_roles ( nombre )")
      .eq("team_id", team.id);
    const userIds = (members ?? []).map((m) => m.user_id);
    const perfilPorId = new Map<string, { nombre: string | null; avatar_url: string | null }>();
    if (userIds.length > 0) {
      const { data: perfiles } = await supabase
        .from("profiles")
        .select("id, nombre, avatar_url")
        .in("id", userIds);
      for (const p of perfiles ?? []) {
        perfilPorId.set(p.id, { nombre: p.nombre, avatar_url: p.avatar_url });
      }
    }
    integrantes = (members ?? []).map((m) => ({
      id: m.user_id,
      nombre: perfilPorId.get(m.user_id)?.nombre ?? "(sin nombre)",
      rol: m.rol?.nombre ?? null,
      avatarUrl: perfilPorId.get(m.user_id)?.avatar_url ?? null,
    }));
  }

  // Quién creó el proyecto ("a cargo"): la organización puede tener varios
  // gestores (M37/M38), así que el nombre de la org sola no dice quién lo
  // cargó — esto sí lo dice.
  let creadoPorNombre: string | null = null;
  // Si su perfil es público, "A cargo de" enlaza a `/u/[id]` (mismo criterio
  // que la tabla de /admin/usuarios: perfil privado se muestra como texto
  // plano, nunca como un link que termine en 404/RLS para el admin).
  let creadoPorPerfilPublico = false;
  if (project.created_by) {
    const { data: creador } = await supabase
      .from("profiles")
      .select("nombre, visibility")
      .eq("id", project.created_by)
      .maybeSingle();
    creadoPorNombre = creador?.nombre ?? "(usuario eliminado)";
    creadoPorPerfilPublico = creador?.visibility === "publico";
  }

  return {
    ...project,
    etiquetaEstado:
      ETIQUETA_ESTADO[project.status as (typeof ESTADOS_PROYECTO)[number]] ?? project.status,
    integrantes,
    creadoPorNombre,
    creadoPorPerfilPublico,
  };
}

export type AdminProjectDetail = NonNullable<
  Awaited<ReturnType<typeof getProjectDetailForAdmin>>
>;

export const ORG_TIPO_LABEL: Record<string, string> = {
  academica: "Académica",
  social: "Social",
  emprendimiento: "Emprendimiento",
  empresa: "Empresa",
  interna: "Interna",
};

export const VERIFICACION_LABEL: Record<string, string> = {
  verificado: "Verificada",
  en_revision: "En revisión",
  sin_verificar: "Sin verificar",
};

// Igual que en /admin/proyectos (M79): la tabla llena el alto disponible con
// scroll interno propio, así que un tamaño generoso no rompe el layout.
export const ADMIN_ORGS_PAGE_SIZE = 30;

/**
 * Página de organizaciones del piloto para `/admin/organizaciones` (M80), con
 * búsqueda (nombre) y filtro de verificación resueltos en SQL
 * (`admin_organizations_page`) — reemplaza traer TODAS las organizaciones y
 * filtrarlas en el cliente. Mismo hallazgo que con proyectos (M79): la RLS
 * `organizations_select_all` ya deja ver cualquier organización a cualquiera
 * (son datos públicos), pero no había ninguna pantalla de admin que las
 * listara — mucho menos una forma de aprobar o rechazar una solicitud de
 * verificación (M62).
 */
export async function getOrganizationsForAdminPage(
  page: number,
  filters: { q?: string; verificacion?: string },
) {
  const supabase = await createClient();
  const offset = Math.max(page - 1, 0) * ADMIN_ORGS_PAGE_SIZE;

  const { data: matches, error: matchError } = await supabase.rpc(
    "admin_organizations_page",
    {
      _q: filters.q?.trim() || undefined,
      _verificacion: filters.verificacion || undefined,
      _limit: ADMIN_ORGS_PAGE_SIZE,
      _offset: offset,
    },
  );

  if (matchError) {
    console.error("[admin_organizations_page]", matchError.message);
    return { orgs: [], total: 0, pageSize: ADMIN_ORGS_PAGE_SIZE };
  }

  const orderedIds = (matches ?? []).map((m) => m.id);
  if (orderedIds.length === 0) {
    // Igual que en catálogo/proyectos admin: el total viaja en las filas
    // devueltas, así que una página fuera de rango necesita una segunda
    // consulta liviana para no reportar "0 resultados" de más.
    if (offset > 0) {
      const { data: primera } = await supabase.rpc("admin_organizations_page", {
        _q: filters.q?.trim() || undefined,
        _verificacion: filters.verificacion || undefined,
        _limit: 1,
        _offset: 0,
      });
      return {
        orgs: [],
        total: primera?.[0] ? Number(primera[0].total_count) : 0,
        pageSize: ADMIN_ORGS_PAGE_SIZE,
      };
    }
    return { orgs: [], total: 0, pageSize: ADMIN_ORGS_PAGE_SIZE };
  }

  const total = Number(matches?.[0]?.total_count ?? 0);

  const { data, error } = await supabase
    .from("organizations")
    .select("id, nombre, tipo, verificacion, created_at")
    .in("id", orderedIds);

  if (error) {
    console.error("[getOrganizationsForAdminPage]", error.message);
    return { orgs: [], total: 0, pageSize: ADMIN_ORGS_PAGE_SIZE };
  }

  const porId = new Map((data ?? []).map((o) => [o.id, o]));
  const orgs = orderedIds
    .map((id) => porId.get(id))
    .filter((o): o is NonNullable<typeof o> => Boolean(o))
    .map((o) => ({
      id: o.id,
      nombre: o.nombre,
      tipo: o.tipo,
      etiquetaTipo: ORG_TIPO_LABEL[o.tipo] ?? o.tipo,
      verificacion: o.verificacion,
      etiquetaVerificacion: VERIFICACION_LABEL[o.verificacion] ?? o.verificacion,
      createdAt: o.created_at,
    }));

  return { orgs, total, pageSize: ADMIN_ORGS_PAGE_SIZE };
}

export type AdminOrgRow = Awaited<
  ReturnType<typeof getOrganizationsForAdminPage>
>["orgs"][number];

/**
 * Cantidad de organizaciones esperando verificación, para el aviso de arriba
 * de `/admin/organizaciones` — independiente de la página/filtro actual de
 * la tabla (antes salía de contar en memoria sobre TODAS las organizaciones
 * ya traídas; con paginación real no hay "todas" en memoria para eso).
 */
export async function getPendingOrgVerificationCount() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("organizations")
    .select("id", { count: "exact", head: true })
    .eq("verificacion", "en_revision");

  if (error) {
    console.error("[getPendingOrgVerificationCount]", error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Detalle de una organización para `/admin/organizaciones/[id]`: solo
 * lectura + acceso a aprobar/rechazar su verificación. Incluye sus
 * proyectos (título y estado, no el detalle completo de cada uno — desde
 * acá se puede saltar a `/admin/proyectos/[id]` si hace falta más) para que
 * el admin tenga contexto real antes de verificar: cuántos proyectos tiene,
 * en qué estado.
 */
export async function getOrganizationDetailForAdmin(id: string) {
  if (!isUuid(id)) return null;
  const supabase = await createClient();

  const { data: org, error } = await supabase
    .from("organizations")
    .select(
      "id, nombre, tipo, descripcion, sitio_web, contacto, contacto_email, logo_url, verificacion, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getOrganizationDetailForAdmin]", error.message);
    return null;
  }
  if (!org) return null;

  const { data: proyectos } = await supabase
    .from("projects")
    .select("id, titulo, status, modalidad, created_at, roles:project_roles(cupos)")
    .eq("org_id", id)
    .order("created_at", { ascending: false });

  return {
    ...org,
    etiquetaTipo: ORG_TIPO_LABEL[org.tipo] ?? org.tipo,
    etiquetaVerificacion: VERIFICACION_LABEL[org.verificacion] ?? org.verificacion,
    proyectos: (proyectos ?? []).map((p) => ({
      id: p.id,
      titulo: p.titulo,
      status: p.status,
      etiquetaEstado: ETIQUETA_ESTADO[p.status as (typeof ESTADOS_PROYECTO)[number]] ?? p.status,
      etiquetaModalidad: (p.modalidad ? MODALIDAD_LABEL[p.modalidad] : null) ?? "—",
      createdAt: p.created_at,
      cupos: (p.roles ?? []).reduce((total, r) => total + r.cupos, 0),
    })),
  };
}

export type AdminOrgDetail = NonNullable<
  Awaited<ReturnType<typeof getOrganizationDetailForAdmin>>
>;

/** Etiquetas legibles de los campos de `pilot_config`, para el detalle de auditoría. */
export const CONFIG_CAMPO_LABEL: Record<string, string> = {
  registro_abierto: "Registro de nuevas cuentas",
  moderacion_previa_obligatoria: "Moderación previa obligatoria",
  patrocinadores_externos: "Patrocinadores externos",
  autoaprobacion_proyectos: "Autoaprobación de proyectos",
  notif_postulacion_recibida: "Notificación: postulación recibida",
  notif_hito_proximo_vencer: "Notificación: hito próximo a vencer",
  notif_respuesta_moderacion: "Notificación: respuesta de moderación",
  notif_resumen_semanal: "Notificación: resumen semanal",
};
