"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Acción de evaluación (lado del gestor). El gestor puntúa a un integrante de su
 * equipo. La RLS `evaluations_insert_manager` / `evaluations_update_evaluator_or_manager`
 * (M6) es la barrera real: exige gestionar el proyecto y evaluar a nombre propio.
 *
 * Es un upsert: hay a lo sumo una evaluación por `(proyecto, evaluado, evaluador)`
 * (unique de M6), así que re-evaluar actualiza la misma fila.
 */

export type EvaluateState = { error?: string; ok?: boolean };

export async function evaluateMember(
  _prevState: EvaluateState,
  formData: FormData,
): Promise<EvaluateState> {
  const projectId = String(formData.get("projectId") ?? "");
  const evaluateeId = String(formData.get("evaluateeId") ?? "");
  const puntajeRaw = String(formData.get("puntaje") ?? "").trim();
  const comentario = String(formData.get("comentario") ?? "").trim();

  if (!projectId || !evaluateeId) return { error: "Falta el integrante a evaluar." };

  // Puntaje 1..5 (el CHECK de M6 lo exige; aquí se valida para dar mensaje claro).
  const puntaje = Number(puntajeRaw);
  if (!Number.isInteger(puntaje) || puntaje < 1 || puntaje > 5) {
    return { error: "Elige un puntaje del 1 al 5." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { error } = await supabase.from("evaluations").upsert(
    {
      project_id: projectId,
      evaluatee_id: evaluateeId,
      evaluator_id: user.id,
      puntaje,
      comentario: comentario || null,
    },
    { onConflict: "project_id,evaluatee_id,evaluator_id" },
  );

  if (error) {
    console.error("[evaluateMember]", error.message);
    return { error: "No se pudo guardar la evaluación. Inténtalo de nuevo." };
  }

  // La evaluación se ve en la gestión del proyecto y en el panel del estudiante.
  revalidatePath(`/mis-proyectos/${projectId}`);
  revalidatePath("/mis-postulaciones");
  return { ok: true };
}
