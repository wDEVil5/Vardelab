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

// Lee y valida un criterio 1–5 del formulario. Mismo CHECK de rango que
// `puntaje` (M6): un criterio fuera de rango es un error de datos, no algo
// que la UI (estrellas) debería poder producir.
function leerCriterio(formData: FormData, campo: string): number | null {
  const raw = String(formData.get(campo) ?? "").trim();
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

export async function evaluateMember(
  _prevState: EvaluateState,
  formData: FormData,
): Promise<EvaluateState> {
  const projectId = String(formData.get("projectId") ?? "");
  const evaluateeId = String(formData.get("evaluateeId") ?? "");
  const comentario = String(formData.get("comentario") ?? "").trim();

  if (!projectId || !evaluateeId) return { error: "Falta el integrante a evaluar." };

  const calidad = leerCriterio(formData, "calidad");
  const colaboracion = leerCriterio(formData, "colaboracion");
  const cumplimientoHitos = leerCriterio(formData, "cumplimientoHitos");

  if (calidad == null || colaboracion == null || cumplimientoHitos == null) {
    return { error: "Califica los tres criterios (calidad, colaboración y cumplimiento)." };
  }

  // `puntaje` se conserva como la nota global (promedio redondeado de los
  // tres criterios): es lo que ya muestran el panel del estudiante y el
  // portafolio, no hace falta tocar esas vistas.
  const puntaje = Math.round((calidad + colaboracion + cumplimientoHitos) / 3);

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
      criterios: {
        calidad,
        colaboracion,
        cumplimiento_hitos: cumplimientoHitos,
      },
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
