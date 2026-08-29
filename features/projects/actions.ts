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
