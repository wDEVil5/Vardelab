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

/**
 * Agrega un rol a un proyecto. La RLS `project_roles_write_manager` (M3) exige
 * que el usuario gestione el proyecto; aquí se validan los datos del rol.
 */
export async function addRole(
  _prevState: AddRoleState,
  formData: FormData,
): Promise<AddRoleState> {
  const projectId = String(formData.get("projectId") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const cuposRaw = String(formData.get("cupos") ?? "").trim();

  if (!projectId) return { error: "Falta el proyecto." };
  if (!nombre) return { error: "El rol necesita un nombre." };

  // Cupos: entero ≥ 1 (la tabla tiene CHECK cupos > 0). Por defecto 1.
  const cupos = cuposRaw ? Number(cuposRaw) : 1;
  if (!Number.isInteger(cupos) || cupos < 1) {
    return { error: "Los cupos deben ser un número entero de 1 o más." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("project_roles").insert({
    project_id: projectId,
    nombre,
    descripcion: descripcion || null,
    cupos,
  });

  if (error) {
    console.error("[addRole]", error.message);
    return { error: "No se pudo agregar el rol. Inténtalo de nuevo." };
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
 * Publica un proyecto (`borrador → publicado`). Simplificación temporal: publica
 * directo, sin el paso `en_revisión` — este se insertará cuando exista la
 * vertical del moderador. Requiere al menos un rol. La RLS
 * `projects_update_manager` (M3) exige gestionar el proyecto.
 */
export async function publishProject(
  _prevState: PublishState,
  formData: FormData,
): Promise<PublishState> {
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return { error: "Falta el proyecto." };

  const supabase = await createClient();

  // Regla de negocio: no se publica un proyecto sin roles.
  const { count } = await supabase
    .from("project_roles")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (!count || count < 1) {
    return { error: "Agrega al menos un rol antes de publicar." };
  }

  const { error } = await supabase
    .from("projects")
    .update({ status: "publicado" })
    .eq("id", projectId);

  if (error) {
    console.error("[publishProject]", error.message);
    return { error: "No se pudo publicar el proyecto." };
  }

  revalidatePath(`/mis-proyectos/${projectId}`);
  revalidatePath("/proyectos");
  return {};
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
