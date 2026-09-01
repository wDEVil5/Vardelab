import { createClient } from "@/lib/supabase/server";

/**
 * Capa de datos del catálogo público de proyectos.
 *
 * Estas funciones corren en el servidor (Server Components) usando el cliente
 * anónimo. La RLS decide qué filas son visibles: aunque la consulta no filtre
 * por estado, el rol anónimo solo puede leer proyectos publicados. Aun así se
 * filtra por `status = 'publicado'` de forma explícita, para que la intención
 * quede en el código y no dependa solo de la política.
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
    verificacion
  ),
  roles:project_roles (
    id,
    nombre,
    cupos,
    skills:project_role_skills (
      nivel_minimo,
      skill:skills ( id, nombre )
    )
  )
` as const;

/**
 * Devuelve los proyectos publicados para el catálogo público, del más reciente
 * al más antiguo, con su organización y los roles/habilidades anidados.
 */
export async function getPublishedProjects() {
  const supabase = await createClient();

  const query = supabase
    .from("projects")
    .select(PROJECT_CARD_SELECT)
    .eq("status", "publicado")
    .order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    // La página que consume esto decide cómo mostrar el fallo; acá solo se
    // registra y se propaga para no devolver datos a medias.
    console.error("[getPublishedProjects]", error.message);
    throw error;
  }

  return data;
}

// Tipo de una tarjeta del catálogo, derivado del retorno de la consulta: se
// mantiene sincronizado con el `select` de arriba sin escribirlo a mano.
// Útil para tipar las props de los componentes de la página (P-02).
export type ProjectCard = Awaited<
  ReturnType<typeof getPublishedProjects>
>[number];

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
  roles:project_roles ( id, nombre, cupos )
` as const;

/**
 * Devuelve los proyectos en revisión, del más antiguo al más reciente (la cola
 * se atiende por orden de llegada). La RLS limita el acceso a moderador/admin;
 * una página que la consuma debe además guardar el acceso por rol.
 */
export async function getProjectsForReview() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_REVIEW_SELECT)
    .eq("status", "en_revision")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getProjectsForReview]", error.message);
    throw error;
  }

  return data;
}

export type ProjectForReview = Awaited<
  ReturnType<typeof getProjectsForReview>
>[number];

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
  organization:organizations (
    id,
    nombre,
    tipo,
    descripcion,
    sitio_web,
    verificacion
  ),
  roles:project_roles (
    id,
    nombre,
    descripcion,
    cupos,
    skills:project_role_skills (
      nivel_minimo,
      skill:skills ( id, nombre )
    )
  )
` as const;

/**
 * Devuelve la ficha de un proyecto publicado por id, o `null` si no existe o no
 * está publicado. `maybeSingle()` no lanza cuando no hay fila: devuelve null y
 * la página decide mostrar 404.
 */
export async function getPublishedProjectById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_DETAIL_SELECT)
    .eq("id", id)
    .eq("status", "publicado")
    .maybeSingle();

  if (error) {
    console.error("[getPublishedProjectById]", error.message);
    throw error;
  }

  return data;
}

// Tipo de la ficha, derivado del retorno (excluye el `null` del caso 404).
export type ProjectDetail = NonNullable<
  Awaited<ReturnType<typeof getPublishedProjectById>>
>;

/**
 * Trae un rol para el flujo de postulación, validando que pertenezca al
 * proyecto indicado y que el proyecto esté publicado. Devuelve `null` si no se
 * cumple (rol inexistente, de otro proyecto, o proyecto no publicado) → la
 * página muestra 404.
 */
export async function getRoleForApplication(projectId: string, roleId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_roles")
    .select(
      `
      id,
      nombre,
      descripcion,
      project:projects!inner ( id, titulo, status ),
      skills:project_role_skills (
        nivel_minimo,
        skill:skills ( id, nombre )
      )
    `,
    )
    .eq("id", roleId)
    .eq("project_id", projectId)
    .eq("project.status", "publicado")
    .maybeSingle();

  if (error) {
    console.error("[getRoleForApplication]", error.message);
    throw error;
  }

  return data;
}

export type RoleForApplication = NonNullable<
  Awaited<ReturnType<typeof getRoleForApplication>>
>;

/**
 * Proyectos creados por el usuario actual (lado del patrocinador), de más
 * reciente a más antiguo, con su organización y el conteo de roles. Incluye
 * borradores. La RLS (`projects_select_published_or_manager`) ya deja al gestor
 * ver los propios aunque no estén publicados.
 */
export async function getMyProjects() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      titulo,
      status,
      modalidad,
      duracion_semanas,
      created_at,
      organization:organizations ( nombre ),
      roles:project_roles ( id )
    `,
    )
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getMyProjects]", error.message);
    throw error;
  }

  return data;
}

export type MyProject = Awaited<ReturnType<typeof getMyProjects>>[number];

/**
 * Proyecto para su gestión por el patrocinador (borrador incluido), con sus
 * roles y las habilidades de cada rol. Devuelve `null` si no existe o el usuario
 * no puede gestionarlo — la RLS `projects_select_published_or_manager` deja al
 * gestor ver los propios; además se filtra por `created_by` para acotar a los
 * suyos y no exponer proyectos publicados de terceros por esta vía.
 */
export async function getManagedProject(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

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
      roles:project_roles (
        id,
        nombre,
        descripcion,
        cupos,
        skills:project_role_skills (
          nivel_minimo,
          skill:skills ( id, nombre )
        )
      )
    `,
    )
    .eq("id", id)
    .eq("created_by", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getManagedProject]", error.message);
    throw error;
  }

  return data;
}

export type ManagedProject = NonNullable<
  Awaited<ReturnType<typeof getManagedProject>>
>;

/**
 * Campos editables de la plantilla de un proyecto propio, para el formulario de
 * edición. `null` si no existe o no es del usuario (filtro por `created_by`) →
 * 404. No incluye `org_id` (la organización no se cambia tras crear) ni
 * `status` (se gestiona con los controles de publicación).
 */
export async function getEditableProject(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, titulo, resumen, problema, alcance, entregable, expectativas, modalidad, duracion_semanas",
    )
    .eq("id", id)
    .eq("created_by", user.id)
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
