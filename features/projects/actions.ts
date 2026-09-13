"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Acciones de proyectos (lado del patrocinador).
 *
 * `createProject` crea un proyecto en estado `borrador` bajo una organización
 * propia. La barrera real es la RLS `projects_insert_own_org` de M3
 * (`created_by = auth.uid()` y dueño de la org); aquí se validan las
 * precondiciones para dar mensajes claros.
 */

export type CreateProjectState = { error?: string };

const MODALIDADES = ["presencial", "remoto", "hibrido"] as const;

export async function createProject(
  _prevState: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const orgId = String(formData.get("orgId") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const resumen = String(formData.get("resumen") ?? "").trim();
  const problema = String(formData.get("problema") ?? "").trim();
  const alcance = String(formData.get("alcance") ?? "").trim();
  const entregable = String(formData.get("entregable") ?? "").trim();
  const expectativas = String(formData.get("expectativas") ?? "").trim();
  const modalidad = String(formData.get("modalidad") ?? "");
  const duracionRaw = String(formData.get("duracion_semanas") ?? "").trim();
  const dedicacionSemanal = String(formData.get("dedicacion_semanal") ?? "").trim();

  if (!orgId) return { error: "Selecciona la organización del proyecto." };
  if (!titulo) return { error: "El proyecto necesita un título." };
  if (!problema || !alcance || !entregable) {
    return { error: "Completa problema, alcance y entregable." };
  }
  if (!MODALIDADES.includes(modalidad as (typeof MODALIDADES)[number])) {
    return { error: "Selecciona una modalidad válida." };
  }

  // Duración: opcional, pero si viene debe ser un entero razonable (1–52).
  let duracion: number | null = null;
  if (duracionRaw) {
    const n = Number(duracionRaw);
    if (!Number.isInteger(n) || n < 1 || n > 52) {
      return { error: "La duración debe ser un número de semanas entre 1 y 52." };
    }
    duracion = n;
  }

  if (dedicacionSemanal.length > 60) {
    return { error: "La dedicación semanal es demasiado larga (máximo 60 caracteres)." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { error } = await supabase.from("projects").insert({
    org_id: orgId,
    created_by: user.id,
    titulo,
    resumen: resumen || null,
    problema,
    alcance,
    entregable,
    expectativas: expectativas || null,
    modalidad: modalidad as (typeof MODALIDADES)[number],
    duracion_semanas: duracion,
    dedicacion_semanal: dedicacionSemanal || null,
    status: "borrador",
  });

  if (error) {
    console.error("[createProject]", error.message);
    return {
      error: "No se pudo crear el proyecto. Revisa que la organización sea tuya.",
    };
  }

  revalidatePath("/mis-proyectos");
  redirect("/mis-proyectos?creado=1");
}

/**
 * Edita la plantilla de un proyecto propio. No toca la organización ni el estado
 * (publicación). La RLS `projects_update_manager` (M3) exige gestionar el
 * proyecto; el update se filtra por `id`.
 */
export async function updateProject(
  _prevState: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const id = String(formData.get("projectId") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const resumen = String(formData.get("resumen") ?? "").trim();
  const problema = String(formData.get("problema") ?? "").trim();
  const alcance = String(formData.get("alcance") ?? "").trim();
  const entregable = String(formData.get("entregable") ?? "").trim();
  const expectativas = String(formData.get("expectativas") ?? "").trim();
  const modalidad = String(formData.get("modalidad") ?? "");
  const duracionRaw = String(formData.get("duracion_semanas") ?? "").trim();
  const dedicacionSemanal = String(formData.get("dedicacion_semanal") ?? "").trim();

  if (!id) return { error: "Falta el proyecto." };
  if (!titulo) return { error: "El proyecto necesita un título." };
  if (!problema || !alcance || !entregable) {
    return { error: "Completa problema, alcance y entregable." };
  }
  if (!MODALIDADES.includes(modalidad as (typeof MODALIDADES)[number])) {
    return { error: "Selecciona una modalidad válida." };
  }

  let duracion: number | null = null;
  if (duracionRaw) {
    const n = Number(duracionRaw);
    if (!Number.isInteger(n) || n < 1 || n > 52) {
      return { error: "La duración debe ser un número de semanas entre 1 y 52." };
    }
    duracion = n;
  }

  if (dedicacionSemanal.length > 60) {
    return { error: "La dedicación semanal es demasiado larga (máximo 60 caracteres)." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      titulo,
      resumen: resumen || null,
      problema,
      alcance,
      entregable,
      expectativas: expectativas || null,
      modalidad: modalidad as (typeof MODALIDADES)[number],
      duracion_semanas: duracion,
      dedicacion_semanal: dedicacionSemanal || null,
    })
    .eq("id", id);

  if (error) {
    console.error("[updateProject]", error.message);
    return { error: "No se pudieron guardar los cambios. Inténtalo de nuevo." };
  }

  revalidatePath(`/mis-proyectos/${id}`);
  revalidatePath("/proyectos");
  redirect(`/mis-proyectos/${id}`);
}

export type AddRoleState = { error?: string };

// Habilidad exigida elegida al crear el rol: id del catálogo + nivel mínimo.
// Se manda como JSON en un campo oculto, igual que las observaciones del
// moderador (M36) — mismo motivo: la cantidad de filas es variable.
type SkillInput = { skillId: string; nivel: string };

function parseSkillsInput(raw: string): SkillInput[] | null {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;

  const limpias: SkillInput[] = [];
  const vistos = new Set<string>();
  for (const item of parsed) {
    if (typeof item !== "object" || item === null) return null;
    const skillId = String((item as Record<string, unknown>).skillId ?? "").trim();
    const nivel = String((item as Record<string, unknown>).nivel ?? "").trim();
    if (!skillId) continue;
    if (!NIVELES_ROL.includes(nivel as (typeof NIVELES_ROL)[number])) return null;
    if (vistos.has(skillId)) continue; // duplicada, se ignora
    vistos.add(skillId);
    limpias.push({ skillId, nivel });
  }
  return limpias;
}

// Adelantado desde `addRoleSkill` más abajo: ambas funciones validan el mismo
// enum de nivel, así que comparten la constante.
const NIVELES_ROL = ["basico", "intermedio", "avanzado"] as const;

/**
 * Agrega un rol a un proyecto, con sus habilidades exigidas de una (S-04/S-XX:
 * antes había que crear el rol y recién ahí, en una segunda pasada, agregarle
 * cada habilidad). La RLS `project_roles_write_manager` (M3) exige que el
 * usuario gestione el proyecto; aquí se validan los datos del rol.
 */
export async function addRole(
  _prevState: AddRoleState,
  formData: FormData,
): Promise<AddRoleState> {
  const projectId = String(formData.get("projectId") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const cuposRaw = String(formData.get("cupos") ?? "").trim();
  const horasRaw = String(formData.get("horas_semanales") ?? "").trim();
  const skills = parseSkillsInput(String(formData.get("skills") ?? ""));

  if (!projectId) return { error: "Falta el proyecto." };
  if (!nombre) return { error: "El rol necesita un nombre." };
  if (skills === null) {
    return { error: "Revisa las habilidades: algo no quedó bien formado." };
  }

  // Cupos: entero ≥ 1 (la tabla tiene CHECK cupos > 0). Por defecto 1.
  const cupos = cuposRaw ? Number(cuposRaw) : 1;
  if (!Number.isInteger(cupos) || cupos < 1) {
    return { error: "Los cupos deben ser un número entero de 1 o más." };
  }

  // Horas semanales: opcional; si viene, entero entre 1 y 60 (CHECK de M19).
  let horasSemanales: number | null = null;
  if (horasRaw) {
    const horas = Number(horasRaw);
    if (!Number.isInteger(horas) || horas < 1 || horas > 60) {
      return { error: "Las horas por semana deben ser un entero entre 1 y 60." };
    }
    horasSemanales = horas;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_roles")
    .insert({
      project_id: projectId,
      nombre,
      descripcion: descripcion || null,
      cupos,
      horas_semanales: horasSemanales,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[addRole]", error?.message);
    return { error: "No se pudo agregar el rol. Inténtalo de nuevo." };
  }

  if (skills.length > 0) {
    const { error: skillsError } = await supabase.from("project_role_skills").insert(
      skills.map((s) => ({
        project_role_id: data.id,
        skill_id: s.skillId,
        nivel_minimo: s.nivel as (typeof NIVELES_ROL)[number],
      })),
    );
    // Falla silenciosa: el rol ya se creó, que es lo mínimo pedido. El gestor
    // puede agregar las habilidades sueltas después si esto no se guardó.
    if (skillsError) {
      console.error("[addRole] habilidades", skillsError.message);
    }
  }

  revalidatePath(`/mis-proyectos/${projectId}`);
  return {};
}

/**
 * Elimina un rol de un proyecto. La RLS restringe a quien gestiona el proyecto;
 * el `project_id` del formulario solo se usa para revalidar la vista.
 */
export async function deleteRole(formData: FormData): Promise<void> {
  const roleId = String(formData.get("roleId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!roleId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_roles")
    .delete()
    .eq("id", roleId);

  if (error) {
    console.error("[deleteRole]", error.message);
  }

  revalidatePath(`/mis-proyectos/${projectId}`);
}

export type AddRoleSkillState = { error?: string };

const NIVELES = ["basico", "intermedio", "avanzado"] as const;

/**
 * Asocia una habilidad exigida a un rol, con su nivel mínimo. La RLS
 * `project_role_skills_write_manager` (M3) exige gestionar el proyecto. El
 * `unique(project_role_id, skill_id)` evita duplicados (se traduce a mensaje).
 */
export async function addRoleSkill(
  _prevState: AddRoleSkillState,
  formData: FormData,
): Promise<AddRoleSkillState> {
  const projectId = String(formData.get("projectId") ?? "");
  const roleId = String(formData.get("roleId") ?? "");
  const skillId = String(formData.get("skillId") ?? "");
  const nivel = String(formData.get("nivel") ?? "");

  if (!roleId || !skillId) return { error: "Selecciona una habilidad." };
  if (!NIVELES.includes(nivel as (typeof NIVELES)[number])) {
    return { error: "Selecciona un nivel válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("project_role_skills").insert({
    project_role_id: roleId,
    skill_id: skillId,
    nivel_minimo: nivel as (typeof NIVELES)[number],
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Esa habilidad ya está en el rol." };
    }
    console.error("[addRoleSkill]", error.message);
    return { error: "No se pudo agregar la habilidad." };
  }

  revalidatePath(`/mis-proyectos/${projectId}`);
  return {};
}

/** Quita una habilidad de un rol. La RLS restringe a quien gestiona el proyecto. */
export async function deleteRoleSkill(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId") ?? "");
  const roleId = String(formData.get("roleId") ?? "");
  const skillId = String(formData.get("skillId") ?? "");
  if (!roleId || !skillId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_role_skills")
    .delete()
    .eq("project_role_id", roleId)
    .eq("skill_id", skillId);

  if (error) {
    console.error("[deleteRoleSkill]", error.message);
  }

  revalidatePath(`/mis-proyectos/${projectId}`);
}

export type PublishState = { error?: string };

/**
 * Envía un proyecto a revisión (`borrador → en_revision`). Antes publicaba
 * directo; desde M18 el paso a `publicado` lo decide el moderador. Requiere al
 * menos un rol. La RLS `projects_update_manager` (M3) exige gestionar el
 * proyecto y el trigger `projects_status_guard` (M18) valida la transición.
 */
export async function submitProjectForReview(
  _prevState: PublishState,
  formData: FormData,
): Promise<PublishState> {
  const projectId = String(formData.get("projectId") ?? "");
  const respuesta = String(formData.get("respuesta") ?? "").trim();
  if (!projectId) return { error: "Falta el proyecto." };

  const supabase = await createClient();

  // Regla de negocio: no se envía a revisión un proyecto sin roles.
  const { count } = await supabase
    .from("project_roles")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (!count || count < 1) {
    return { error: "Agrega al menos un rol antes de enviarlo a revisión." };
  }

  // Si el proyecto viene de un rechazo (M36/S-07), responder es obligatorio:
  // es lo único que le queda al moderador para saber qué cambió sin tener que
  // adivinar a partir del diff del proyecto. Un envío nuevo (sin comentario
  // previo) no tiene nada que responder, así que no aplica.
  const { data: actual } = await supabase
    .from("projects")
    .select("comentario_moderacion")
    .eq("id", projectId)
    .maybeSingle();

  if (actual?.comentario_moderacion && !respuesta) {
    return { error: "Responde al moderador antes de reenviar." };
  }

  // El comentario del moderador y las observaciones (M36) NO se limpian acá:
  // quedan visibles mientras el proyecto está de nuevo en revisión, para que
  // el moderador tenga el contexto de qué se le pidió y qué respondió el
  // gestor. Recién se limpian cuando el moderador toma la próxima decisión
  // (`approveProject`/`rejectProject`).
  const { error } = await supabase
    .from("projects")
    .update({ status: "en_revision", respuesta_patrocinador: respuesta || null })
    .eq("id", projectId);

  if (error) {
    console.error("[submitProjectForReview]", error.message);
    return { error: "No se pudo enviar el proyecto a revisión." };
  }

  revalidatePath(`/mis-proyectos/${projectId}`);
  revalidatePath(`/mis-proyectos/${projectId}/observaciones`);
  revalidatePath("/moderacion");
  return {};
}

/** Retira un proyecto de la cola de revisión (`en_revision → borrador`). */
export async function withdrawFromReview(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ status: "borrador" })
    .eq("id", projectId);

  if (error) {
    console.error("[withdrawFromReview]", error.message);
  }

  revalidatePath(`/mis-proyectos/${projectId}`);
  revalidatePath("/moderacion");
}

/** Regresa un proyecto publicado a borrador (para editarlo o retirarlo). */
export async function unpublishProject(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ status: "borrador" })
    .eq("id", projectId);

  if (error) {
    console.error("[unpublishProject]", error.message);
  }

  revalidatePath(`/mis-proyectos/${projectId}`);
  revalidatePath("/proyectos");
}

export type ModerationState = { error?: string };

/**
 * Aprueba un proyecto en revisión (`en_revision → publicado`). Solo moderador/
 * admin: lo garantizan la RLS `projects_update_moderator` y el trigger
 * `projects_status_guard` (M18); si el usuario no tiene el rol, la actualización
 * no afecta filas y se informa el error.
 */
export async function approveProject(
  _prevState: ModerationState,
  formData: FormData,
): Promise<ModerationState> {
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return { error: "Falta el proyecto." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({
      status: "publicado",
      revisado_at: new Date().toISOString(),
      // Limpia un motivo de rechazo previo y la respuesta del gestor: ya se
      // resolvió, no debe seguir apareciendo en la página del proyecto.
      comentario_moderacion: null,
      respuesta_patrocinador: null,
    })
    .eq("id", projectId)
    .eq("status", "en_revision")
    .select("id");

  if (error) {
    console.error("[approveProject]", error.message);
    return { error: "No se pudo aprobar el proyecto." };
  }
  if (!data || data.length === 0) {
    return { error: "No se pudo aprobar (¿ya no está en revisión?)." };
  }

  // Las observaciones (M36) ya cumplieron su ciclo. Falla silenciosa: el
  // proyecto ya quedó aprobado, no vale la pena revertir por esto.
  const { error: obsError } = await supabase
    .from("project_observations")
    .delete()
    .eq("project_id", projectId);
  if (obsError) {
    console.error("[approveProject] observaciones", obsError.message);
  }

  revalidatePath("/moderacion");
  revalidatePath("/proyectos");
  revalidatePath(`/mis-proyectos/${projectId}/observaciones`);
  return {};
}

/**
 * Rechaza un proyecto en revisión y lo devuelve a borrador (`en_revision →
 * borrador`) para que el gestor lo ajuste. El motivo es obligatorio: es lo que
 * el gestor va a ver en su proyecto para saber qué corregir (M21). Mismas
 * garantías de rol que aprobar.
 */
// Observación puntual (M36): categoría corta + qué corregir. El moderador las
// arma en el cliente y las manda como un JSON en un campo oculto — más simple
// que inputs indexados para una lista de largo variable.
type ObservacionInput = { categoria: string; texto: string };

function parseObservaciones(raw: string): ObservacionInput[] | null {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;

  const limpias: ObservacionInput[] = [];
  for (const item of parsed) {
    if (typeof item !== "object" || item === null) return null;
    const categoria = String((item as Record<string, unknown>).categoria ?? "").trim();
    const texto = String((item as Record<string, unknown>).texto ?? "").trim();
    if (!categoria || !texto) continue; // fila vacía, se ignora
    if (categoria.length > 40 || texto.length > 300) return null;
    limpias.push({ categoria, texto });
  }
  return limpias;
}

export async function rejectProject(
  _prevState: ModerationState,
  formData: FormData,
): Promise<ModerationState> {
  const projectId = String(formData.get("projectId") ?? "");
  const comentario = String(formData.get("comentario") ?? "").trim();
  const observaciones = parseObservaciones(
    String(formData.get("observaciones") ?? ""),
  );
  if (!projectId) return { error: "Falta el proyecto." };
  if (!comentario) {
    return { error: "Deja un motivo: es lo que verá la organización." };
  }
  if (comentario.length > 1000) {
    return { error: "El motivo es demasiado largo (máximo 1000 caracteres)." };
  }
  if (observaciones === null) {
    return { error: "Revisa las observaciones: algo no quedó bien formado." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({
      status: "borrador",
      comentario_moderacion: comentario,
      // Nueva ronda de revisión: la respuesta anterior del gestor ya no aplica.
      respuesta_patrocinador: null,
    })
    .eq("id", projectId)
    .eq("status", "en_revision")
    .select("id");

  if (error) {
    console.error("[rejectProject]", error.message);
    return { error: "No se pudo rechazar el proyecto." };
  }
  if (!data || data.length === 0) {
    return { error: "No se pudo rechazar (¿ya no está en revisión?)." };
  }

  // Reemplaza las observaciones de la ronda anterior por las nuevas. Falla
  // silenciosa (igual que en `approveProject`): el motivo general ya quedó
  // guardado, que es lo mínimo que necesita el gestor para saber qué pasó.
  const { error: deleteError } = await supabase
    .from("project_observations")
    .delete()
    .eq("project_id", projectId);
  if (deleteError) {
    console.error("[rejectProject] borrar observaciones", deleteError.message);
  } else if (observaciones.length > 0) {
    const { error: insertError } = await supabase.from("project_observations").insert(
      observaciones.map((o) => ({
        project_id: projectId,
        categoria: o.categoria,
        texto: o.texto,
      })),
    );
    if (insertError) {
      console.error("[rejectProject] crear observaciones", insertError.message);
    }
  }

  revalidatePath("/moderacion");
  revalidatePath(`/mis-proyectos/${projectId}`);
  revalidatePath(`/mis-proyectos/${projectId}/observaciones`);
  return {};
}

/**
 * Marca/desmarca una observación como resuelta (S-07). Es la propia
 * declaración del gestor de que ya la atendió — no la verifica el moderador
 * hasta la próxima revisión — así que no hace falta un estado de error visible;
 * si falla, el checkbox vuelve a su valor real al revalidar.
 */
export async function toggleObservationResuelta(formData: FormData): Promise<void> {
  const observationId = String(formData.get("observationId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const resuelta = formData.get("resuelta") === "on";
  if (!observationId || !projectId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_observations")
    .update({ resuelta })
    .eq("id", observationId);

  if (error) {
    console.error("[toggleObservationResuelta]", error.message);
  }

  revalidatePath(`/mis-proyectos/${projectId}/observaciones`);
}

export type CloseProjectState = { error?: string };

/**
 * Cierra un proyecto (`activo → completado`, M31): valida y aprueba el hito
 * final si todavía estaba `entregado`, y recién ahí cierra el proyecto. No deja
 * cerrar sin una entrega final real (`entregado` o ya `aprobado`) — es la
 * precondición de negocio que el trigger `projects_guard_status` no valida (solo
 * decide quién puede hacer la transición). El trigger es la barrera real de la
 * transición.
 */
export async function closeProject(
  _prevState: CloseProjectState,
  formData: FormData,
): Promise<CloseProjectState> {
  const projectId = String(formData.get("projectId") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "");
  if (!projectId) return { error: "Falta el proyecto." };
  if (!milestoneId) {
    return { error: "Define un hito final con una entrega antes de cerrar el proyecto." };
  }

  const supabase = await createClient();

  const { data: milestone } = await supabase
    .from("milestones")
    .select("estado")
    .eq("id", milestoneId)
    .maybeSingle();

  if (!milestone || (milestone.estado !== "entregado" && milestone.estado !== "aprobado")) {
    return { error: "El equipo todavía no entregó el hito final." };
  }

  if (milestone.estado === "entregado") {
    const { error: approveError } = await supabase
      .from("milestones")
      .update({ estado: "aprobado" })
      .eq("id", milestoneId)
      .eq("estado", "entregado");
    if (approveError) {
      console.error("[closeProject:approve]", approveError.message);
      return { error: "No se pudo aprobar la entrega final." };
    }
  }

  const { data, error } = await supabase
    .from("projects")
    .update({ status: "completado" })
    .eq("id", projectId)
    .eq("status", "activo")
    .select("id");

  if (error) {
    console.error("[closeProject]", error.message);
    return { error: "No se pudo cerrar el proyecto." };
  }
  if (!data || data.length === 0) {
    return { error: "No se pudo cerrar (¿el proyecto ya no está activo?)." };
  }

  revalidatePath(`/mis-proyectos/${projectId}/validar`);
  revalidatePath(`/mis-proyectos/${projectId}`);
  revalidatePath("/mis-proyectos");
  return {};
}

export type DeleteProjectState = { error?: string };

/**
 * Elimina un proyecto propio. Reglas de seguridad (por las cascadas: borrar un
 * proyecto arrastra roles, postulaciones, equipos, hitos y evaluaciones):
 *   1. Solo en estado `borrador` (un proyecto publicado se despublica primero).
 *   2. Sin postulaciones (protege el registro de los estudiantes).
 * La RLS `projects_delete_manager` (M3) ya restringe a quien gestiona el
 * proyecto; estas guardas agregan la protección de negocio y mensajes claros.
 */
export async function deleteProject(
  _prevState: DeleteProjectState,
  formData: FormData,
): Promise<DeleteProjectState> {
  const id = String(formData.get("projectId") ?? "");
  if (!id) return { error: "Falta el proyecto." };

  const supabase = await createClient();

  // 1) Debe estar en borrador.
  const { data: proj } = await supabase
    .from("projects")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (!proj) redirect("/mis-proyectos"); // ya no existe
  if (proj.status !== "borrador") {
    return {
      error:
        "Solo puedes eliminar un proyecto en borrador. Vuélvelo a borrador primero.",
    };
  }

  // 2) No debe tener postulaciones (en ninguno de sus roles).
  const { data: roles } = await supabase
    .from("project_roles")
    .select("id")
    .eq("project_id", id);
  const roleIds = (roles ?? []).map((r) => r.id);

  if (roleIds.length > 0) {
    const { count } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .in("project_role_id", roleIds);
    if (count && count > 0) {
      return {
        error:
          "No puedes eliminar un proyecto que ya tiene postulaciones. Considera dejarlo en borrador.",
      };
    }
  }

  // 3) Eliminar (la RLS confirma que es gestionable por el usuario).
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) {
    console.error("[deleteProject]", error.message);
    return { error: "No se pudo eliminar el proyecto. Inténtalo de nuevo." };
  }

  revalidatePath("/mis-proyectos");
  redirect("/mis-proyectos?eliminado=1");
}
