"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/features/auth/queries";
import { sendEmailToUser } from "@/features/notifications/email";

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

// Duración: opcional, pero si viene debe ser un entero razonable (1–52).
// Reutilizada por `createProject` y `updateProject` (mismo mensaje, mismo
// rango) — mismo criterio que `CriterioSchema` en features/evaluations/actions.ts
// (2026-10-16).
const DuracionSemanasSchema = z
  .string()
  .trim()
  .transform((v) => (v ? Number(v) : null))
  .refine((n) => n === null || (Number.isInteger(n) && n >= 1 && n <= 52), {
    error: "La duración debe ser un número de semanas entre 1 y 52.",
  });

// `problema`/`alcance`/`entregable` comparten mensaje (el chequeo original
// los trataba como una sola condición); el resto de los campos no se pisan
// entre sí, así que el orden del shape (igual al de la cadena de `if`
// original) alcanza sin `superRefine`.
const CreateProjectSchema = z.object({
  orgId: z.string().min(1, "Selecciona la organización del proyecto."),
  titulo: z.string().trim().min(1, "El proyecto necesita un título."),
  problema: z.string().trim().min(1, "Completa problema, alcance y entregable."),
  alcance: z.string().trim().min(1, "Completa problema, alcance y entregable."),
  entregable: z.string().trim().min(1, "Completa problema, alcance y entregable."),
  modalidad: z.enum(MODALIDADES, { error: "Selecciona una modalidad válida." }),
  duracion: DuracionSemanasSchema,
  dedicacionSemanal: z
    .string()
    .trim()
    .max(60, "La dedicación semanal es demasiado larga (máximo 60 caracteres)."),
  resumen: z.string().trim(),
  expectativas: z.string().trim(),
});

export async function createProject(
  _prevState: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const parsed = CreateProjectSchema.safeParse({
    orgId: String(formData.get("orgId") ?? ""),
    titulo: String(formData.get("titulo") ?? ""),
    problema: String(formData.get("problema") ?? ""),
    alcance: String(formData.get("alcance") ?? ""),
    entregable: String(formData.get("entregable") ?? ""),
    modalidad: String(formData.get("modalidad") ?? ""),
    duracion: String(formData.get("duracion_semanas") ?? ""),
    dedicacionSemanal: String(formData.get("dedicacion_semanal") ?? ""),
    resumen: String(formData.get("resumen") ?? ""),
    expectativas: String(formData.get("expectativas") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const {
    orgId, titulo, problema, alcance, entregable, modalidad, duracion, dedicacionSemanal,
    resumen, expectativas,
  } = parsed.data;

  const supabase = await createClient();

  const user = await requireUser(supabase);

  const { error } = await supabase.from("projects").insert({
    org_id: orgId,
    created_by: user.id,
    titulo,
    resumen: resumen || null,
    problema,
    alcance,
    entregable,
    expectativas: expectativas || null,
    modalidad,
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
// Mismo razonamiento que `CreateProjectSchema`: `id`/`titulo`/`problema`-
// `alcance`-`entregable`/`modalidad` no se pisan entre sí (más allá del
// mensaje compartido entre los tres campos del "completa problema...").
const UpdateProjectSchema = z.object({
  id: z.string().min(1, "Falta el proyecto."),
  titulo: z.string().trim().min(1, "El proyecto necesita un título."),
  problema: z.string().trim().min(1, "Completa problema, alcance y entregable."),
  alcance: z.string().trim().min(1, "Completa problema, alcance y entregable."),
  entregable: z.string().trim().min(1, "Completa problema, alcance y entregable."),
  modalidad: z.enum(MODALIDADES, { error: "Selecciona una modalidad válida." }),
  duracion: DuracionSemanasSchema,
  dedicacionSemanal: z
    .string()
    .trim()
    .max(60, "La dedicación semanal es demasiado larga (máximo 60 caracteres)."),
  resumen: z.string().trim(),
  expectativas: z.string().trim(),
});

export async function updateProject(
  _prevState: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const parsed = UpdateProjectSchema.safeParse({
    id: String(formData.get("projectId") ?? ""),
    titulo: String(formData.get("titulo") ?? ""),
    problema: String(formData.get("problema") ?? ""),
    alcance: String(formData.get("alcance") ?? ""),
    entregable: String(formData.get("entregable") ?? ""),
    modalidad: String(formData.get("modalidad") ?? ""),
    duracion: String(formData.get("duracion_semanas") ?? ""),
    dedicacionSemanal: String(formData.get("dedicacion_semanal") ?? ""),
    resumen: String(formData.get("resumen") ?? ""),
    expectativas: String(formData.get("expectativas") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const {
    id, titulo, problema, alcance, entregable, modalidad, duracion, dedicacionSemanal,
    resumen, expectativas,
  } = parsed.data;

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
      modalidad,
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

export type AddRoleState = { error?: string; created?: string; warning?: string };

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

// Cupos: entero ≥ 1 (la tabla tiene CHECK cupos > 0). Por defecto 1 si no
// viene — a diferencia de `DuracionSemanasSchema`, acá "vacío" no es "sin
// validar": se convierte a 1 y SÍ se valida (siempre es válido, pero la
// conversión ocurre igual).
const CuposSchema = z
  .string()
  .trim()
  .transform((v) => (v ? Number(v) : 1))
  .refine((n) => Number.isInteger(n) && n >= 1, {
    error: "Los cupos deben ser un número entero de 1 o más.",
  });

// Horas semanales: opcional; si viene, entero entre 1 y 60 (CHECK de M19).
// Reutilizada por `addRole` y `updateRole` (mismo mensaje, mismo rango).
const HorasSemanalesSchema = z
  .string()
  .trim()
  .transform((v) => (v ? Number(v) : null))
  .refine((n) => n === null || (Number.isInteger(n) && n >= 1 && n <= 60), {
    error: "Las horas por semana deben ser un entero entre 1 y 60.",
  });

const SkillsInputSchema = z
  .string()
  .transform((raw) => parseSkillsInput(raw))
  .refine((v): v is SkillInput[] => v !== null, {
    error: "Revisa las habilidades: algo no quedó bien formado.",
  });

// `projectId`/`nombre`/`skills`/`cupos` no se pisan entre sí (cada uno solo
// puede fallar por su propio motivo), así que el orden del shape (igual al
// de la cadena de `if` original) alcanza sin `superRefine`.
const AddRoleSchema = z.object({
  projectId: z.string().min(1, "Falta el proyecto."),
  nombre: z.string().trim().min(1, "El rol necesita un nombre."),
  skills: SkillsInputSchema,
  cupos: CuposSchema,
  horasSemanales: HorasSemanalesSchema,
  descripcion: z.string().trim(),
});

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
  const parsed = AddRoleSchema.safeParse({
    projectId: String(formData.get("projectId") ?? ""),
    nombre: String(formData.get("nombre") ?? ""),
    skills: String(formData.get("skills") ?? ""),
    cupos: String(formData.get("cupos") ?? ""),
    horasSemanales: String(formData.get("horas_semanales") ?? ""),
    descripcion: String(formData.get("descripcion") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { projectId, nombre, skills, cupos, horasSemanales, descripcion } = parsed.data;

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

  let warning: string | undefined;
  if (skills.length > 0) {
    const { error: skillsError } = await supabase.from("project_role_skills").insert(
      skills.map((s) => ({
        project_role_id: data.id,
        skill_id: s.skillId,
        nivel_minimo: s.nivel as (typeof NIVELES_ROL)[number],
      })),
    );
    // Conserva el rol creado e informa si hay que volver a agregar habilidades.
    if (skillsError) {
      console.error("[addRole] habilidades", skillsError.message);
      warning = "El rol se creó, pero no se guardaron sus habilidades. Puedes agregarlas desde la tarjeta del rol.";
    }
  }

  revalidatePath(`/mis-proyectos/${projectId}`);
  return { created: nombre, warning };
}

export type UpdateRoleState = { error?: string };

/**
 * Edita nombre/descripción/cupos/horas de un rol ya creado (antes no existía
 * ningún camino para esto: solo se podía agregar y borrar). Las habilidades
 * se siguen editando aparte, con `addRoleSkill`/`deleteRoleSkill` desde
 * `RoleSkillsEditor` — este formulario no las toca. La RLS
 * `project_roles_update_manager` (M76) exige gestionar el proyecto.
 *
 * Guarda propia (no solo delegada a la base): los cupos no pueden bajar del
 * número de postulaciones ya `aceptada` en este rol — dejaría el rol
 * "sobre-cubierto" (más aceptados que cupos) sin sacar a nadie, rompiendo el
 * cálculo de cupos restantes (M72). Si hace falta bajar cupos por debajo de
 * eso, primero hay que quitar a alguien del equipo (`removeTeamMember`).
 */
// Reutiliza `CuposSchema`/`HorasSemanalesSchema` de `addRole`.
const UpdateRoleSchema = z.object({
  roleId: z.string().min(1, "Falta el rol."),
  projectId: z.string(),
  nombre: z.string().trim().min(1, "El rol necesita un nombre."),
  descripcion: z.string().trim(),
  cupos: CuposSchema,
  horasSemanales: HorasSemanalesSchema,
});

export async function updateRole(
  _prevState: UpdateRoleState,
  formData: FormData,
): Promise<UpdateRoleState> {
  const parsed = UpdateRoleSchema.safeParse({
    roleId: String(formData.get("roleId") ?? ""),
    projectId: String(formData.get("projectId") ?? ""),
    nombre: String(formData.get("nombre") ?? ""),
    descripcion: String(formData.get("descripcion") ?? ""),
    cupos: String(formData.get("cupos") ?? ""),
    horasSemanales: String(formData.get("horas_semanales") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { roleId, projectId, nombre, descripcion, cupos, horasSemanales } = parsed.data;

  const supabase = await createClient();

  const { count: aceptadas } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("project_role_id", roleId)
    .eq("status", "aceptada");

  if ((aceptadas ?? 0) > cupos) {
    return {
      error: `Ya hay ${aceptadas} persona${aceptadas === 1 ? "" : "s"} aceptada${aceptadas === 1 ? "" : "s"} en este rol: los cupos no pueden bajar de ese número. Para liberar cupos, primero quita a alguien del equipo.`,
    };
  }

  const { error } = await supabase
    .from("project_roles")
    .update({
      nombre,
      descripcion: descripcion || null,
      cupos,
      horas_semanales: horasSemanales,
    })
    .eq("id", roleId);

  if (error) {
    console.error("[updateRole]", error.message);
    return { error: "No se pudo actualizar el rol. Inténtalo de nuevo." };
  }

  revalidatePath(`/mis-proyectos/${projectId}`);
  return {};
}

export type DeleteRoleState = { error?: string };

/**
 * Elimina un rol de un proyecto. La RLS `project_roles_delete_manager` (M76)
 * es la barrera real: además de exigir gestionar el proyecto, bloquea el
 * borrado si el rol tiene una postulación 'enviada' o 'aceptada' — borrar un
 * rol así de golpe se llevaba la postulación entera por delante (`ON DELETE
 * CASCADE`), sin aviso. El chequeo de acá adelanta esa misma condición para
 * dar un mensaje claro en vez de un rechazo genérico de RLS.
 */
export async function deleteRole(
  _prevState: DeleteRoleState,
  formData: FormData,
): Promise<DeleteRoleState> {
  const roleId = String(formData.get("roleId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!roleId) return { error: "Falta el rol." };

  const supabase = await createClient();

  const { count } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("project_role_id", roleId)
    .in("status", ["enviada", "aceptada"]);

  if ((count ?? 0) > 0) {
    return {
      error:
        "Este rol tiene postulaciones activas. Resuélvelas (o quita del equipo a quien ya esté aceptado) antes de eliminarlo.",
    };
  }

  const { error } = await supabase
    .from("project_roles")
    .delete()
    .eq("id", roleId);

  if (error) {
    console.error("[deleteRole]", error.message);
    return { error: "No se pudo eliminar el rol. Inténtalo de nuevo." };
  }

  revalidatePath(`/mis-proyectos/${projectId}`);
  return {};
}

export type AddRoleSkillState = { error?: string };

const NIVELES = ["basico", "intermedio", "avanzado"] as const;

/**
 * Asocia una habilidad exigida a un rol, con su nivel mínimo. La RLS
 * `project_role_skills_write_manager` (M3) exige gestionar el proyecto. El
 * `unique(project_role_id, skill_id)` evita duplicados (se traduce a mensaje).
 */
// `roleId`/`skillId` comparten mensaje (el chequeo original los trataba
// como una sola condición).
const AddRoleSkillSchema = z.object({
  projectId: z.string(),
  roleId: z.string().min(1, "Selecciona una habilidad."),
  skillId: z.string().min(1, "Selecciona una habilidad."),
  nivel: z.enum(NIVELES, { error: "Selecciona un nivel válido." }),
});

export async function addRoleSkill(
  _prevState: AddRoleSkillState,
  formData: FormData,
): Promise<AddRoleSkillState> {
  const parsed = AddRoleSkillSchema.safeParse({
    projectId: String(formData.get("projectId") ?? ""),
    roleId: String(formData.get("roleId") ?? ""),
    skillId: String(formData.get("skillId") ?? ""),
    nivel: String(formData.get("nivel") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { projectId, roleId, skillId, nivel } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("project_role_skills").insert({
    project_role_id: roleId,
    skill_id: skillId,
    nivel_minimo: nivel,
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

export type DeleteRoleSkillState = { error?: string };

/** Quita una habilidad de un rol. La RLS restringe a quien gestiona el proyecto. */
export async function deleteRoleSkill(
  _prevState: DeleteRoleSkillState,
  formData: FormData,
): Promise<DeleteRoleSkillState> {
  const projectId = String(formData.get("projectId") ?? "");
  const roleId = String(formData.get("roleId") ?? "");
  const skillId = String(formData.get("skillId") ?? "");
  if (!roleId || !skillId) return { error: "Falta la habilidad." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_role_skills")
    .delete()
    .eq("project_role_id", roleId)
    .eq("skill_id", skillId);

  if (error) {
    console.error("[deleteRoleSkill]", error.message);
    return { error: "No se pudo quitar la habilidad. Inténtalo de nuevo." };
  }

  revalidatePath(`/mis-proyectos/${projectId}`);
  return {};
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

const ObservacionesSchema = z
  .string()
  .transform((raw) => parseObservaciones(raw))
  .refine((v): v is ObservacionInput[] => v !== null, {
    error: "Revisa las observaciones: algo no quedó bien formado.",
  });

// `projectId`/`comentario`/`observaciones` no se pisan entre sí (los dos
// chequeos de `comentario` — vacío, demasiado largo — son del mismo campo,
// mismo orden que `.min().max()` en `escalateReport`,
// features/reports/actions.ts, 2026-10-20).
const RejectProjectSchema = z.object({
  projectId: z.string().min(1, "Falta el proyecto."),
  comentario: z
    .string()
    .trim()
    .min(1, "Deja un motivo: es lo que verá la organización.")
    .max(1000, "El motivo es demasiado largo (máximo 1000 caracteres)."),
  observaciones: ObservacionesSchema,
});

export async function rejectProject(
  _prevState: ModerationState,
  formData: FormData,
): Promise<ModerationState> {
  const parsed = RejectProjectSchema.safeParse({
    projectId: String(formData.get("projectId") ?? ""),
    comentario: String(formData.get("comentario") ?? ""),
    observaciones: String(formData.get("observaciones") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { projectId, comentario, observaciones } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
    .select("id, titulo, org_id");

  if (error) {
    console.error("[rejectProject]", error.message);
    return { error: "No se pudo rechazar el proyecto." };
  }
  if (!data || data.length === 0) {
    return { error: "No se pudo rechazar (¿ya no está en revisión?)." };
  }

  // Correo a quien gestiona la organización, mismo criterio que `applyToRole`
  // (M43): la notificación in-app ya la crea el trigger `notify_proyecto_rechazado`
  // (M91), acá se rearma el mismo texto a mano por no tener `pg_net`.
  const [rechazado] = data;
  const texto = `El proyecto "${rechazado.titulo}" volvió a borrador: un moderador pidió cambios. Motivo: ${comentario}`;
  const link = `/mis-proyectos/${projectId}`;
  after(async () => {
    const { data: destinatarios } = await supabase.rpc("org_recipient_ids", {
      _org_id: rechazado.org_id,
    });
    await Promise.all(
      (destinatarios ?? [])
        .filter((id) => id !== user?.id)
        .map((id) => sendEmailToUser(id, "proyecto_rechazado", texto, link)),
    );
  });

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

export type CloseProjectState = { error?: string; ok?: boolean };

const CLOSE_PROJECT_ERROR: Record<string, string> = {
  sin_hito_final: "El equipo todavía no entregó el hito final.",
  faltan_evaluaciones: "Evalúa a todos los integrantes del equipo antes de cerrar el proyecto.",
  no_activo: "No se pudo cerrar (¿el proyecto ya no está activo?).",
};

/**
 * Cierra un proyecto (`activo → completado`). Delegado a `close_project`
 * (M103, `security definer`): aprueba el hito final si hacía falta, exige
 * evaluación de todo el equipo activo (RF-09) y cierra el proyecto, todo en
 * una sola transacción — antes eran 2 `update` sueltos desde acá, sin
 * evaluación y sin protección contra un fallo a mitad de camino.
 */
const CloseProjectSchema = z.object({
  projectId: z.string().min(1, "Falta el proyecto."),
  milestoneId: z.string().min(1, "Define un hito final con una entrega antes de cerrar el proyecto."),
});

export async function closeProject(
  _prevState: CloseProjectState,
  formData: FormData,
): Promise<CloseProjectState> {
  const parsed = CloseProjectSchema.safeParse({
    projectId: String(formData.get("projectId") ?? ""),
    milestoneId: String(formData.get("milestoneId") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { projectId, milestoneId } = parsed.data;

  const supabase = await createClient();

  const { data: resultado, error } = await supabase.rpc("close_project", {
    _project_id: projectId,
    _milestone_id: milestoneId,
  });

  if (error) {
    console.error("[closeProject]", error.message);
    return { error: "No se pudo cerrar el proyecto." };
  }
  if (resultado !== "ok") {
    return { error: CLOSE_PROJECT_ERROR[resultado as string] ?? "No se pudo cerrar el proyecto." };
  }

  revalidatePath(`/mis-proyectos/${projectId}/validar`);
  revalidatePath(`/mis-proyectos/${projectId}`);
  revalidatePath("/mis-proyectos");
  revalidatePath("/proyecto");
  revalidatePath(`/proyecto/${projectId}`, "layout");
  revalidatePath("/inicio");
  revalidatePath("/proyectos");
  revalidatePath(`/proyectos/${projectId}`);
  return { ok: true };
}

export type SetDisclosureState = { error?: string };

/**
 * Permiso único por proyecto (no por material, decisión del piloto) para que
 * sus integrantes muestren el nombre/resultado en su portafolio público
 * (M102). El gestor lo decide cuándo quiera, no solo al cerrar: un proyecto
 * activo también puede autorizarse para permitir evidencia "en curso".
 * La RLS `projects_update_manager` es la barrera real; el `.select("id")`
 * detecta un intento sin permiso (0 filas) en vez de fallar en silencio.
 */
export async function setProjectDisclosure(
  projectId: string,
  autoriza: boolean,
): Promise<SetDisclosureState> {
  const supabase = await createClient();
  await requireUser(supabase);

  const { data, error } = await supabase
    .from("projects")
    .update({ autoriza_divulgacion: autoriza })
    .eq("id", projectId)
    .select("id");

  if (error) {
    console.error("[setProjectDisclosure]", error.message);
    return { error: "No se pudo guardar. Inténtalo de nuevo." };
  }
  if (!data || data.length === 0) {
    return { error: "No tienes permiso para cambiar esto." };
  }

  revalidatePath(`/mis-proyectos/${projectId}/validar`);
  revalidatePath("/perfil");
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

export type CancelProjectState = { error?: string };

/**
 * Cancela un proyecto (M60): el gestor puede hacerlo desde cualquier estado
 * salvo uno ya completado (terminal, no tiene sentido cancelarlo) o ya
 * cancelado. La RLS y el trigger `projects_guard_status` son la barrera real
 * de quién puede y desde qué estado — acá solo se filtra en la propia query
 * para poder dar un mensaje claro si ya no aplica, y un trigger aparte
 * (`notify_proyecto_cancelado`) avisa al equipo y a la organización.
 */
export async function cancelProject(
  _prevState: CancelProjectState,
  formData: FormData,
): Promise<CancelProjectState> {
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return { error: "Falta el proyecto." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("projects")
    .update({ status: "cancelado" })
    .eq("id", projectId)
    .neq("status", "completado")
    .neq("status", "cancelado")
    .select("id, titulo, org_id");

  if (error) {
    console.error("[cancelProject]", error.message);
    return { error: "No se pudo cancelar el proyecto." };
  }
  if (!data || data.length === 0) {
    return { error: "No se pudo cancelar (¿ya está completado o cancelado?)." };
  }

  // Correo al equipo del proyecto y a quien gestiona la organización, mismo
  // criterio que `applyToRole` (M43) y el trigger `notify_proyecto_cancelado`
  // (M60): la notificación in-app ya la crea el trigger, acá se rearma el
  // mismo texto a mano por no tener `pg_net`.
  const [cancelado] = data;
  const texto = `El proyecto "${cancelado.titulo}" fue cancelado.`;
  after(async () => {
    const [{ data: equipo }, { data: destinatariosOrg }] = await Promise.all([
      supabase.from("teams").select("team_members(user_id)").eq("project_id", projectId).maybeSingle(),
      supabase.rpc("org_recipient_ids", { _org_id: cancelado.org_id }),
    ]);
    const idsEquipo = (equipo?.team_members ?? []).map((m) => m.user_id);
    const destinatarios = new Set([...idsEquipo, ...(destinatariosOrg ?? [])]);
    destinatarios.delete(user?.id ?? "");
    await Promise.all(
      [...destinatarios].map((id) =>
        sendEmailToUser(id, "proyecto_cancelado", texto, `/mis-proyectos/${projectId}`),
      ),
    );
  });

  revalidatePath(`/mis-proyectos/${projectId}`);
  revalidatePath("/mis-proyectos");
  revalidatePath("/proyectos");
  revalidatePath(`/admin/proyectos/${projectId}`);
  revalidatePath("/admin/proyectos");
  return {};
}
