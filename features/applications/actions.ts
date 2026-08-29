"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Acciones de postulación (Server Actions).
 *
 * `applyToRole` inserta una postulación del usuario autenticado a un rol. La RLS
 * de M4 (`applications_insert_own`) es la barrera real: exige que `applicant_id`
 * sea el propio usuario y que el rol pertenezca a un proyecto publicado. Aquí se
 * validan las precondiciones para dar mensajes claros.
 */

export type ApplyState = { error?: string };

export async function applyToRole(
  _prevState: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const projectId = String(formData.get("projectId") ?? "");
  const roleId = String(formData.get("roleId") ?? "");
  const mensaje = String(formData.get("mensaje") ?? "").trim();
  const evidencia = String(formData.get("evidencia") ?? "").trim();
  const disponibilidad = String(formData.get("disponibilidad") ?? "").trim();

  if (!roleId || !projectId) {
    return { error: "Falta el rol al que postulas." };
  }
  if (!mensaje) {
    return { error: "Escribe un mensaje para tu postulación." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Sin sesión no se puede postular; se envía al ingreso.
    redirect(`/ingresar`);
  }

  const { error } = await supabase.from("applications").insert({
    project_role_id: roleId,
    applicant_id: user.id,
    mensaje,
    // Campos opcionales: se guardan solo si el estudiante los completó.
    evidencia: evidencia || null,
    disponibilidad: disponibilidad || null,
  });

  if (error) {
    // 23505 = violación de unique(project_role_id, applicant_id): ya existe una
    // postulación de esta persona a este rol.
    if (error.code === "23505") {
      return { error: "Ya postulaste a este rol." };
    }
    console.error("[applyToRole]", error.message);
    return { error: "No se pudo enviar la postulación. Inténtalo de nuevo." };
  }

  revalidatePath(`/proyectos/${projectId}`);
  redirect(`/proyectos/${projectId}?postulado=1`);
}

/**
 * Retira una postulación propia (estado → `retirada`). Solo transiciona desde
 * `enviada`: no permite deshacer una decisión ya tomada por el gestor. La RLS
 * garantiza que solo el autor pueda tocar su fila; el filtro por `status` y
 * `applicant_id` acota la operación en el propio update.
 */
export async function withdrawApplication(formData: FormData): Promise<void> {
  const applicationId = String(formData.get("applicationId") ?? "");
  if (!applicationId) return;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/ingresar");
  }

  const { error } = await supabase
    .from("applications")
    .update({ status: "retirada" })
    .eq("id", applicationId)
    .eq("applicant_id", user.id)
    .eq("status", "enviada");

  if (error) {
    console.error("[withdrawApplication]", error.message);
  }

  revalidatePath("/mis-postulaciones");
}

/**
 * Resuelve una postulación (aceptar/rechazar) desde el lado del gestor. Solo
 * actúa sobre postulaciones `enviada` (no revierte una retirada). La RLS
 * `applications_update_manager` (M12) exige gestionar el rol; el filtro por
 * `status` acota la transición.
 */
async function resolveApplication(
  formData: FormData,
  nuevoEstado: "aceptada" | "rechazada",
): Promise<void> {
  const applicationId = String(formData.get("applicationId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!applicationId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("applications")
    .update({ status: nuevoEstado })
    .eq("id", applicationId)
    .eq("status", "enviada");

  if (error) {
    console.error("[resolveApplication]", error.message);
  }

  revalidatePath(`/mis-proyectos/${projectId}/postulaciones`);
}

/**
 * Acepta una postulación respetando los cupos del rol: si el rol ya tiene tantas
 * aceptadas como cupos, no acepta más (guarda de servidor, defensa en profundidad
 * junto con la UI que oculta el botón). Solo actúa sobre postulaciones `enviada`.
 */
export async function acceptApplication(formData: FormData): Promise<void> {
  const applicationId = String(formData.get("applicationId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!applicationId) return;

  const supabase = await createClient();

  // Rol y estado de la postulación.
  const { data: app } = await supabase
    .from("applications")
    .select("project_role_id, status")
    .eq("id", applicationId)
    .maybeSingle();

  if (app && app.status === "enviada") {
    const [{ data: role }, { count }] = await Promise.all([
      supabase
        .from("project_roles")
        .select("cupos")
        .eq("id", app.project_role_id)
        .maybeSingle(),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("project_role_id", app.project_role_id)
        .eq("status", "aceptada"),
    ]);

    // Solo acepta si quedan cupos.
    if (role && (count ?? 0) < role.cupos) {
      const { error } = await supabase
        .from("applications")
        .update({ status: "aceptada" })
        .eq("id", applicationId)
        .eq("status", "enviada");
      if (error) console.error("[acceptApplication]", error.message);
    }
  }

  revalidatePath(`/mis-proyectos/${projectId}/postulaciones`);
}

export async function rejectApplication(formData: FormData): Promise<void> {
  return resolveApplication(formData, "rechazada");
}
