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
