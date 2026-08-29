"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Acciones de entregas (lado del estudiante/equipo). La RLS
 * `submissions_insert_member` (M5) exige ser integrante del equipo del proyecto
 * del hito. El modelo es "enlace + nota" (no se aloja el trabajo, se enlaza):
 * la URL apunta a dónde vive (repo, deploy, Figma, video…) y la nota da contexto.
 */

export type SubmissionState = { error?: string };

export async function addSubmission(
  _prevState: SubmissionState,
  formData: FormData,
): Promise<SubmissionState> {
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  const nota = String(formData.get("nota") ?? "").trim();

  if (!milestoneId) return { error: "Falta el hito." };
  if (!url && !nota) {
    return { error: "Agrega al menos un enlace o una nota." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { error } = await supabase.from("submissions").insert({
    milestone_id: milestoneId,
    submitted_by: user.id,
    url: url || null,
    nota: nota || null,
  });

  if (error) {
    console.error("[addSubmission]", error.message);
    return { error: "No se pudo registrar la entrega. Inténtalo de nuevo." };
  }

  // La entrega se ve desde la página del equipo del estudiante y la del gestor.
  revalidatePath(`/mis-proyectos/${projectId}`);
  revalidatePath("/mis-postulaciones");
  return {};
}

/** Elimina una entrega propia (o el gestor). RLS `submissions_delete_author_or_manager`. */
export async function deleteSubmission(formData: FormData): Promise<void> {
  const submissionId = String(formData.get("submissionId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!submissionId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("submissions")
    .delete()
    .eq("id", submissionId);

  if (error) console.error("[deleteSubmission]", error.message);

  revalidatePath(`/mis-proyectos/${projectId}`);
  revalidatePath("/mis-postulaciones");
}
