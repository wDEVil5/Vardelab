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
