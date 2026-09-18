import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { getMyOrgIds } from "@/features/organizations/queries";
import { isUuid } from "@/lib/utils";

/**
 * Capa de datos del catálogo público de proyectos.
 *
 * Estas funciones corren en el servidor (Server Components) usando el cliente
 * anónimo. La RLS decide qué filas son visibles: aunque la consulta no filtre
 * por estado, el rol anónimo solo puede leer proyectos 'publicado' o
 * 'seleccion' (M33: sigue recibiendo postulaciones mientras se arma el
 * equipo). Aun así se filtra por estado de forma explícita, para que la
 * intención quede en el código y no dependa solo de la política.
 */

// Campos que necesita una tarjeta del catálogo (P-02): datos del proyecto, la
// organización que lo publica y los roles con sus habilidades exigidas.
const PROJECT_CARD_SELECT = `
  id,
  titulo,
  resumen,
  modalidad,
  duracion_semanas,
  created_at,
  organization:organizations (
    id,
    nombre,
    tipo,
    logo_url,
    verificacion
  ),
  roles:project_roles (
    id,
    nombre,
    cupos,
    horas_semanales,
    skills:project_role_skills (
      nivel_minimo,
      skill:skills ( id, nombre )
    )
  )
` as const;

/**
 * Cuántas postulaciones ya están `aceptada` por rol, para poder mostrar cupos
 * REALMENTE restantes (`cupos - aceptadas`) en vez del total original —
 * `applications` es privada (`applications_select_own_or_manager`), así que
 * un visitante anónimo no puede contarlas con un `select` normal; se resuelve
 * con la función `security definer` `accepted_counts_for_roles` (M72), que
 * expone solo el conteo por rol, nunca las postulaciones en sí.
 */
async function aceptadasPorRol(
  supabase: ReturnType<typeof createPublicClient>,
  roleIds: string[],
): Promise<Map<string, number>> {
  const mapa = new Map<string, number>();
  if (roleIds.length === 0) return mapa;
  const { data, error } = await supabase.rpc("accepted_counts_for_roles", {
    _role_ids: roleIds,
  });
  if (error) {
    console.error("[accepted_counts_for_roles]", error.message);
    return mapa;
  }
  for (const row of data ?? []) mapa.set(row.project_role_id, Number(row.aceptadas));
  return mapa;
}

async function fetchPublishedProjects(limit?: number) {
  const supabase = createPublicClient();

  let query = supabase
    .from("projects")
    .select(PROJECT_CARD_SELECT)
    .in("status", ["publicado", "seleccion"])
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    // La página que consume esto decide cómo mostrar el fallo; aquí solo se
    // registra y se propaga para no devolver datos a medias.
    console.error("[getPublishedProjects]", error.message);
    throw error;
  }

  const proyectos = data ?? [];
  const mapa = await aceptadasPorRol(
    supabase,
    proyectos.flatMap((p) => (p.roles ?? []).map((r) => r.id)),
  );
  return proyectos.map((p) => ({
    ...p,
    roles: (p.roles ?? []).map((r) => ({ ...r, aceptadas: mapa.get(r.id) ?? 0 })),
  }));
}

/**
 * Devuelve los proyectos publicados para el catálogo público, del más reciente
 * al más antiguo, con su organización y los roles/habilidades anidados.
 *
 * Cacheado (revalida cada 60 s): son datos públicos e iguales para todos, así se
 * evita una consulta a la base en cada request. Los cambios en la vitrina
 * (aprobar/editar/despublicar) aparecen dentro de esa ventana.
 */
export const getPublishedProjects = unstable_cache(
  fetchPublishedProjects,
  ["published-projects"],
  { revalidate: 60 },
);

// Tipo de una tarjeta del catálogo, derivado del retorno de la consulta: se
// mantiene sincronizado con el `select` de arriba sin escribirlo a mano.
// Útil para tipar las props de los componentes de la página (P-02).
export type ProjectCard = Awaited<
  ReturnType<typeof getPublishedProjects>
>[number];

export const CATALOG_PAGE_SIZE = 12;

export type CatalogFilters = {
  q?: string;
  skill?: string;
  modalidad?: string;
};

export type CatalogPage = {
  projects: ProjectCard[];
  total: number;
  pageSize: number;
};

async function fetchPublishedProjectsPage(
  page: number,
  filters: CatalogFilters,
): Promise<CatalogPage> {
  const supabase = createPublicClient();
  const offset = Math.max(page - 1, 0) * CATALOG_PAGE_SIZE;

  // Búsqueda, modalidad, habilidad y paginación se resuelven en SQL
  // (`search_published_projects`, M78) — no traemos el catálogo entero para
  // filtrarlo en memoria como antes.
  const { data: matches, error: matchError } = await supabase.rpc(
    "search_published_projects",
    {
      _q: filters.q?.trim() || undefined,
      _skill: filters.skill || undefined,
      _modalidad: filters.modalidad || undefined,
      _limit: CATALOG_PAGE_SIZE,
      _offset: offset,
    },
  );

  if (matchError) {
    console.error("[search_published_projects]", matchError.message);
    throw matchError;
  }

  const orderedIds = (matches ?? []).map((m) => m.id);
  if (orderedIds.length === 0) {
    // `count(*) over()` viaja en las filas devueltas: si el offset pedido
    // (ej. una URL con ?page= fuera de rango) no devuelve ninguna, no hay de
    // dónde leer el total real — se pide de nuevo desde el principio (limit 1,
    // liviano) solo para saber cuántos resultados hay en total.
    if (offset > 0) {
      const { data: primera } = await supabase.rpc("search_published_projects", {
        _q: filters.q?.trim() || undefined,
        _skill: filters.skill || undefined,
        _modalidad: filters.modalidad || undefined,
        _limit: 1,
        _offset: 0,
      });
      return {
        projects: [],
        total: primera?.[0] ? Number(primera[0].total_count) : 0,
        pageSize: CATALOG_PAGE_SIZE,
      };
    }
    return { projects: [], total: 0, pageSize: CATALOG_PAGE_SIZE };
  }

  const total = Number(matches?.[0]?.total_count ?? 0);

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_CARD_SELECT)
    .in("id", orderedIds);

  if (error) {
    console.error("[fetchPublishedProjectsPage]", error.message);
    throw error;
  }

  // `.in()` no garantiza el orden: se reordena según lo que ya decidió
  // `search_published_projects` (created_at desc).
  const porId = new Map((data ?? []).map((p) => [p.id, p]));
  const proyectos = orderedIds
    .map((id) => porId.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const mapa = await aceptadasPorRol(
    supabase,
    proyectos.flatMap((p) => (p.roles ?? []).map((r) => r.id)),
  );
  return {
    projects: proyectos.map((p) => ({
      ...p,
      roles: (p.roles ?? []).map((r) => ({ ...r, aceptadas: mapa.get(r.id) ?? 0 })),
    })),
    total,
    pageSize: CATALOG_PAGE_SIZE,
  };
}

/**
 * Página del catálogo público (P-02), con búsqueda/filtros resueltos en SQL y
 * paginación real — reemplaza el patrón anterior de traer `getPublishedProjects()`
 * completo y filtrar/paginar en memoria, que escalaba mal (ver M78).
 *
 * Cacheado por combinación exacta de page+filtros (60 s, igual que
 * `getPublishedProjects`): `unstable_cache` deriva la clave de estos
 * argumentos, así que cada página/búsqueda tiene su propia entrada.
 */
export const getPublishedProjectsPage = unstable_cache(
  fetchPublishedProjectsPage,
  ["published-projects-page"],
  { revalidate: 60 },
);

/**
 * Habilidades para los chips del catálogo — independiente de la página y del
 * filtro de habilidad activo (si no, elegir un chip haría desaparecer al
 * resto). Ver `catalog_skill_facets` (M78): acotada por la cantidad de
 * habilidades distintas del catálogo, no por la cantidad de proyectos.
 */
export const getCatalogSkillFacets = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase.rpc("catalog_skill_facets");
    if (error) {
      console.error("[catalog_skill_facets]", error.message);
      return [] as string[];
    }
    return (data ?? []).map((d) => d.nombre);
  },
  ["catalog-skill-facets"],
  { revalidate: 60 },
);

/**
 * Proyectos publicados de una organización puntual, para su perfil público.
 * Sin cachear (a diferencia de `getPublishedProjects`): es una vista de bajo
 * tráfico y evita tener que derivar una clave de caché por organización.
 */
export async function getPublishedProjectsByOrg(orgId: string) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_CARD_SELECT)
    .eq("org_id", orgId)
    .in("status", ["publicado", "seleccion"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getPublishedProjectsByOrg]", error.message);
    throw error;
  }

  const proyectos = data ?? [];
  const mapa = await aceptadasPorRol(
    supabase,
    proyectos.flatMap((p) => (p.roles ?? []).map((r) => r.id)),
  );
  return proyectos.map((p) => ({
    ...p,
    roles: (p.roles ?? []).map((r) => ({ ...r, aceptadas: mapa.get(r.id) ?? 0 })),
  }));
}

/**
 * Proyectos parecidos al de la ficha (P-03), para el bloque "Proyectos
 * similares". Reusa `getPublishedProjects` (misma caché y `PROJECT_CARD_SELECT`,
 * sin query extra ni cambios de RLS): excluye el actual y ordena por afinidad —
 * misma organización, skills en común y misma modalidad — y luego por
 * antigüedad. Devuelve como máximo `limit` (default 3); lista vacía si no hay
 * candidatos.
 *
 * El universo de candidatos se acota a los 200 más recientes (no el catálogo
 * completo): traer los 6000+ del catálogo real solo para puntuar y quedarse
 * con 3 era el mismo anti-patrón ya resuelto en /proyectos (M78).
 */
export async function getSimilarPublishedProjects(
  current: {
    id: string;
    modalidad: string | null;
    orgId: string | null;
    skillIds: string[];
  },
  limit = 3,
): Promise<ProjectCard[]> {
  const all = await getPublishedProjects(200);
  const skillSet = new Set(current.skillIds);

  const scored = all
    .filter((p) => p.id !== current.id)
    .map((p) => {
      const orgId = p.organization?.id ?? null;
      const sameOrg = Boolean(current.orgId && orgId === current.orgId);
      const skills = new Set(
        (p.roles ?? []).flatMap((r) =>
          (r.skills ?? [])
            .map((s) => s.skill?.id)
            .filter((id): id is string => Boolean(id)),
        ),
      );
      let sharedSkills = 0;
      for (const id of skills) if (skillSet.has(id)) sharedSkills += 1;
      const sameModalidad = Boolean(
        current.modalidad && p.modalidad === current.modalidad,
      );
      // Pesos simples: org > skills compartidos > modalidad.
      const score =
        (sameOrg ? 100 : 0) + sharedSkills * 10 + (sameModalidad ? 5 : 0);
      return { project: p, score, created_at: p.created_at };
    })
    // Si nadie comparte nada, igual mostrar recientes del catálogo para no
    // dejar el bloque vacío cuando hay otros proyectos publicados.
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    })
    .slice(0, limit)
    .map((s) => s.project);

  return scored;
}

// Cola de moderación (M18): proyectos en `en_revision`, esperando aprobación.
// Solo un moderador/admin los ve (RLS `projects_select_moderator`). Incluye el
// alcance (problema/alcance/entregable) para poder revisar antes de aprobar.
const PROJECT_REVIEW_SELECT = `
  id,
  titulo,
  resumen,
  problema,
  alcance,
  entregable,
  modalidad,
  duracion_semanas,
  created_at,
  organization:organizations ( id, nombre, tipo, verificacion ),
  roles:project_roles ( id, nombre, cupos, horas_semanales )
` as const;

export const MODERATION_QUEUE_PAGE_SIZE = 20;

/**
 * Página de la cola de moderación (M81), del más antiguo al más reciente (se
 * atiende por orden de llegada), con búsqueda (proyecto/organización) y
 * filtro de modalidad resueltos en SQL (`moderation_queue_page`) —
 * reemplaza traer TODOS los proyectos en revisión y filtrarlos en memoria.
 * La RLS de `projects` (`security invoker`) sigue exigiendo moderador/admin.
 */
export async function getProjectsForReviewPage(
  page: number,
  filters: { q?: string; modalidad?: string },
) {
  const supabase = await createClient();
  const offset = Math.max(page - 1, 0) * MODERATION_QUEUE_PAGE_SIZE;

  const { data: matches, error: matchError } = await supabase.rpc(
    "moderation_queue_page",
    {
      _q: filters.q?.trim() || undefined,
      _modalidad: filters.modalidad || undefined,
      _limit: MODERATION_QUEUE_PAGE_SIZE,
      _offset: offset,
    },
  );

  if (matchError) {
    console.error("[moderation_queue_page]", matchError.message);
    return { proyectos: [], total: 0, pageSize: MODERATION_QUEUE_PAGE_SIZE };
  }

  const orderedIds = (matches ?? []).map((m) => m.id);
  if (orderedIds.length === 0) {
    if (offset > 0) {
      const { data: primera } = await supabase.rpc("moderation_queue_page", {
        _q: filters.q?.trim() || undefined,
        _modalidad: filters.modalidad || undefined,
        _limit: 1,
        _offset: 0,
      });
      return {
        proyectos: [],
        total: primera?.[0] ? Number(primera[0].total_count) : 0,
        pageSize: MODERATION_QUEUE_PAGE_SIZE,
      };
    }
    return { proyectos: [], total: 0, pageSize: MODERATION_QUEUE_PAGE_SIZE };
  }

  const total = Number(matches?.[0]?.total_count ?? 0);

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_REVIEW_SELECT)
    .in("id", orderedIds);

  if (error) {
    console.error("[getProjectsForReviewPage]", error.message);
    return { proyectos: [], total: 0, pageSize: MODERATION_QUEUE_PAGE_SIZE };
  }

  const porId = new Map((data ?? []).map((p) => [p.id, p]));
  // orden de llegada (más antiguo primero), como decidió moderation_queue_page
  const proyectos = orderedIds
    .map((id) => porId.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return { proyectos, total, pageSize: MODERATION_QUEUE_PAGE_SIZE };
}

/**
 * KPIs de la cola completa (M81) — independientes del filtro/página actual.
 */
export async function getModerationQueueStats() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("moderation_queue_stats");

  if (error || !data?.[0]) {
    console.error("[moderation_queue_stats]", error?.message);
    return { pendientes: 0, organizaciones: 0, cuposAbiertos: 0 };
  }

  return {
    pendientes: Number(data[0].pendientes),
    organizaciones: Number(data[0].organizaciones),
    cuposAbiertos: Number(data[0].cupos_abiertos),
  };
}

/**
 * Cuántos proyectos en revisión hay por modalidad, para los contadores del
 * filtro — independiente de la búsqueda/página actual de la tabla.
 */
export async function getModerationModalidadCounts() {
  const supabase = await createClient();
  const modalidades = ["remoto", "presencial", "hibrido"] as const;

  const [total, ...porModalidad] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "en_revision"),
    ...modalidades.map((m) =>
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("status", "en_revision")
        .eq("modalidad", m),
    ),
  ]);

  return {
    todas: total.count ?? 0,
    remoto: porModalidad[0]?.count ?? 0,
    presencial: porModalidad[1]?.count ?? 0,
    hibrido: porModalidad[2]?.count ?? 0,
  };
}

export type ProjectForReview = Awaited<
  ReturnType<typeof getProjectsForReviewPage>
>["proyectos"][number];

// Detalle completo para revisar un proyecto puntual (M-02): suma `expectativas`
// y `descripcion` de cada rol, que la vista de cola no necesita.
const PROJECT_REVIEW_DETAIL_SELECT = `
  id,
  titulo,
  resumen,
  problema,
  alcance,
  entregable,
  expectativas,
  modalidad,
  duracion_semanas,
  created_at,
  comentario_moderacion,
  respuesta_patrocinador,
  organization:organizations ( id, nombre, tipo, verificacion ),
  roles:project_roles ( id, nombre, descripcion, cupos, horas_semanales ),
  observaciones:project_observations ( id, categoria, texto, resuelta )
` as const;

/**
 * Un proyecto en revisión por id, con su detalle completo, para la pantalla de
 * revisión (M-02). `null` si no existe o ya no está en revisión (aprobado,
 * rechazado por otro moderador mientras tanto, etc.) → la página vuelve a la
 * cola. La RLS `projects_select_moderator` limita a moderador/admin.
 */
export async function getProjectForModeration(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_REVIEW_DETAIL_SELECT)
    .eq("id", id)
    .eq("status", "en_revision")
    .maybeSingle();

  if (error) {
    console.error("[getProjectForModeration]", error.message);
    return null;
  }

  return data;
}

export type ProjectForModerationDetail = NonNullable<
  Awaited<ReturnType<typeof getProjectForModeration>>
>;

// Campos de la ficha completa (P-03): la plantilla del proyecto en detalle
// (problema, alcance, entregable, expectativas) más la organización con su
// contacto y los roles con descripción y habilidades exigidas.
const PROJECT_DETAIL_SELECT = `
  id,
  titulo,
  resumen,
  problema,
  alcance,
  entregable,
  expectativas,
  modalidad,
  duracion_semanas,
  created_at,
  revisado_at,
  organization:organizations (
    id,
    nombre,
    tipo,
    descripcion,
    sitio_web,
    logo_url,
    verificacion
  ),
  roles:project_roles (
    id,
    nombre,
    descripcion,
    cupos,
    horas_semanales,
    skills:project_role_skills (
      nivel_minimo,
      skill:skills ( id, nombre )
    )
  )
` as const;

async function fetchPublishedProjectById(id: string) {
  if (!isUuid(id)) return null;
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_DETAIL_SELECT)
    .eq("id", id)
    .in("status", ["publicado", "seleccion"])
    .maybeSingle();

  if (error) {
    console.error("[getPublishedProjectById]", error.message);
    throw error;
  }
  if (!data) return null;

  const mapa = await aceptadasPorRol(supabase, (data.roles ?? []).map((r) => r.id));
  return {
    ...data,
    roles: (data.roles ?? []).map((r) => ({ ...r, aceptadas: mapa.get(r.id) ?? 0 })),
  };
}

/**
 * Devuelve la ficha de un proyecto publicado por id, o `null` si el id no
 * tiene forma de UUID, no existe o no está publicado — en los tres casos la
 * página decide mostrar 404. `maybeSingle()` no lanza cuando no hay fila; la
 * validación de formato evita el caso aparte en que un id malformado (URL
 * escrita a mano) hace que Postgres tire un error real en vez de "sin filas".
 *
 * Cacheado por id (revalida cada 5 min): datos públicos, se evita golpear la
 * base en cada visita a la ficha.
 */
export const getPublishedProjectById = unstable_cache(
  fetchPublishedProjectById,
  ["published-project-by-id"],
  { revalidate: 300 },
);

// Tipo de la ficha, derivado del retorno (excluye el `null` del caso 404).
export type ProjectDetail = NonNullable<
  Awaited<ReturnType<typeof getPublishedProjectById>>
>;

/**
 * Trae un rol para el flujo de postulación, validando que pertenezca al
 * proyecto indicado y que el proyecto esté publicado. Devuelve `null` si no se
 * cumple (id malformado, rol inexistente, de otro proyecto, o proyecto no
 * publicado) → la página muestra 404.
 *
 * Incluye `aceptadas` (M72): la página necesita saber si el rol ya está lleno
 * para no ofrecer el formulario — la guarda real vive en la RLS de
 * `applications_insert_own`, esto es solo para no confundir con un formulario
 * que de todas formas la base va a rechazar.
 */
export async function getRoleForApplication(projectId: string, roleId: string) {
  if (!isUuid(projectId) || !isUuid(roleId)) return null;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_roles")
    .select(
      `
      id,
      nombre,
      descripcion,
      cupos,
      project:projects!inner ( id, titulo, resumen, modalidad, duracion_semanas, status ),
      skills:project_role_skills (
        nivel_minimo,
        skill:skills ( id, nombre )
      )
    `,
    )
    .eq("id", roleId)
    .eq("project_id", projectId)
    .in("project.status", ["publicado", "seleccion"])
    .maybeSingle();

  if (error) {
    console.error("[getRoleForApplication]", error.message);
    throw error;
  }
  if (!data) return null;

  const { data: counts, error: countsError } = await supabase.rpc(
    "accepted_counts_for_roles",
    { _role_ids: [data.id] },
  );
  if (countsError) console.error("[accepted_counts_for_roles]", countsError.message);
  const aceptadas = Number(counts?.[0]?.aceptadas ?? 0);

  return { ...data, aceptadas };
}

export type RoleForApplication = NonNullable<
  Awaited<ReturnType<typeof getRoleForApplication>>
>;

/**
 * Proyectos de las organizaciones que el usuario actual gestiona (dueño o
 * miembro, M38), de más reciente a más antiguo, con su organización y el
 * conteo de roles. Incluye borradores. La RLS (`projects_select_published_or_manager`)
 * ya deja al gestor ver los propios aunque no estén publicados.
 */
export async function getMyProjects() {
  const orgIds = await getMyOrgIds();
  if (orgIds.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      titulo,
      status,
      modalidad,
      duracion_semanas,
      comentario_moderacion,
      created_at,
      organization:organizations ( nombre ),
      roles:project_roles ( id, applications ( status ) ),
      team:teams ( team_members ( id ) )
    `,
    )
    .in("org_id", orgIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getMyProjects]", error.message);
    throw error;
  }

  // Deriva el tamaño del equipo y las postulaciones pendientes acá: la
  // página no necesita conocer la forma anidada cruda (team/roles/applications).
  return (data ?? []).map((p) => ({
    ...p,
    equipoTamano: p.team?.team_members?.length ?? 0,
    postulacionesPendientes: (p.roles ?? []).reduce(
      (total, r) =>
        total + (r.applications ?? []).filter((a) => a.status === "enviada").length,
      0,
    ),
  }));
}

export type MyProject = Awaited<ReturnType<typeof getMyProjects>>[number];

/**
 * Proyecto para su gestión por el patrocinador (borrador incluido), con sus
 * roles y las habilidades de cada rol. Devuelve `null` si no existe o el usuario
 * no puede gestionarlo — la RLS `projects_select_published_or_manager` deja al
 * gestor ver los propios; además se filtra por organización (dueño o miembro,
 * M38) para acotar a las suyas y no exponer proyectos publicados de terceros
 * por esta vía.
 */
export async function getManagedProject(id: string) {
  const orgIds = await getMyOrgIds();
  if (orgIds.length === 0) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      titulo,
      resumen,
      status,
      modalidad,
      duracion_semanas,
      comentario_moderacion,
      created_at,
      roles:project_roles (
        id,
        nombre,
        descripcion,
        cupos,
        horas_semanales,
        skills:project_role_skills (
          nivel_minimo,
          skill:skills ( id, nombre )
        )
      )
    `,
    )
    .eq("id", id)
    .in("org_id", orgIds)
    .maybeSingle();

  if (error) {
    console.error("[getManagedProject]", error.message);
    throw error;
  }

  return data;
}

/**
 * Proyecto para la pantalla de observaciones del moderador (S-07): estado,
 * comentario general, respuesta ya escrita (si la había) y el detalle de cada
 * observación. `null` si no existe o el usuario no gestiona su organización
 * (dueño o miembro, igual que `getManagedProject`) → la página muestra 404.
 */
export async function getProjectObservations(id: string) {
  const orgIds = await getMyOrgIds();
  if (orgIds.length === 0) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      titulo,
      status,
      comentario_moderacion,
      respuesta_patrocinador,
      observaciones:project_observations ( id, categoria, texto, resuelta )
    `,
    )
    .eq("id", id)
    .in("org_id", orgIds)
    .maybeSingle();

  if (error) {
    console.error("[getProjectObservations]", error.message);
    throw error;
  }

  return data;
}

export type ProjectObservations = NonNullable<
  Awaited<ReturnType<typeof getProjectObservations>>
>;

export type ManagedProject = NonNullable<
  Awaited<ReturnType<typeof getManagedProject>>
>;

/**
 * Campos editables de la plantilla de un proyecto propio, para el formulario de
 * edición. `null` si no existe o el usuario no gestiona su organización (dueño
 * o miembro, M38) → 404. No incluye `org_id` (la organización no se cambia
 * tras crear) ni `status` (se gestiona con los controles de publicación).
 */
export async function getEditableProject(id: string) {
  const orgIds = await getMyOrgIds();
  if (orgIds.length === 0) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, titulo, resumen, problema, alcance, entregable, expectativas, modalidad, duracion_semanas, dedicacion_semanal",
    )
    .eq("id", id)
    .in("org_id", orgIds)
    .maybeSingle();

  if (error) {
    console.error("[getEditableProject]", error.message);
    throw error;
  }

  return data;
}

export type EditableProject = NonNullable<
  Awaited<ReturnType<typeof getEditableProject>>
>;
