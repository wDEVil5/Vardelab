"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/features/auth/queries";
import { sendEmailToUser } from "@/features/notifications/email";

/**
 * Acción de evaluación (lado del gestor). El gestor puntúa a un integrante de su
 * equipo. La RLS `evaluations_insert_manager` / `evaluations_update_evaluator_or_manager`
 * (M6) es la barrera real: exige gestionar el proyecto y evaluar a nombre propio.
 *
 * Es un upsert: hay a lo sumo una evaluación por `(proyecto, evaluado, evaluador)`
 * (unique de M6), así que re-evaluar actualiza la misma fila.
 */

export type EvaluateState = { error?: string; ok?: boolean };

// Mismo CHECK de rango que `puntaje` (M6): un criterio fuera de 1–5 es un
// error de datos, no algo que la UI (estrellas) debería poder producir. Los
// tres criterios comparten un solo mensaje, como antes de migrar a zod.
const CriterioSchema = z
  .string()
  .trim()
  .transform((v) => Number(v))
  .refine((n) => Number.isInteger(n) && n >= 1 && n <= 5, {
    error: "Califica los tres criterios (calidad, colaboración y cumplimiento).",
  });

// Mismo orden que la cadena de `if` que reemplaza: projectId/evaluateeId se
// revisan antes que los criterios, así que issues[0] respeta esa prioridad.
const EvaluateMemberSchema = z.object({
  projectId: z.string().min(1, "Falta el integrante a evaluar."),
  evaluateeId: z.string().min(1, "Falta el integrante a evaluar."),
  comentario: z.string().trim(),
  calidad: CriterioSchema,
  colaboracion: CriterioSchema,
  cumplimientoHitos: CriterioSchema,
});

export async function evaluateMember(
  _prevState: EvaluateState,
  formData: FormData,
): Promise<EvaluateState> {
  const parsed = EvaluateMemberSchema.safeParse({
    projectId: String(formData.get("projectId") ?? ""),
    evaluateeId: String(formData.get("evaluateeId") ?? ""),
    comentario: String(formData.get("comentario") ?? ""),
    calidad: String(formData.get("calidad") ?? ""),
    colaboracion: String(formData.get("colaboracion") ?? ""),
    cumplimientoHitos: String(formData.get("cumplimientoHitos") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { projectId, evaluateeId, comentario, calidad, colaboracion, cumplimientoHitos } = parsed.data;

  // `puntaje` se conserva como la nota global (promedio redondeado de los
  // tres criterios): es lo que ya muestran el panel del estudiante y el
  // portafolio, no hace falta tocar esas vistas.
  const puntaje = Math.round((calidad + colaboracion + cumplimientoHitos) / 3);

  const supabase = await createClient();
  const user = await requireUser(supabase);

  // Si ya existía una evaluación para este (proyecto, evaluado, evaluador),
  // esto es una edición, no un evento nuevo — el trigger de M39 solo notifica
  // en el insert, así que el correo (M43) sigue el mismo criterio.
  const { data: yaExistia } = await supabase
    .from("evaluations")
    .select("id")
    .eq("project_id", projectId)
    .eq("evaluatee_id", evaluateeId)
    .eq("evaluator_id", user.id)
    .maybeSingle();

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

  if (!yaExistia) {
    const { data: proyecto } = await supabase
      .from("projects")
      .select("titulo")
      .eq("id", projectId)
      .maybeSingle();
    const titulo = proyecto?.titulo ?? "un proyecto";
    after(() =>
      sendEmailToUser(
        evaluateeId,
        "evaluacion_nueva",
        `Recibiste una evaluación en "${titulo}".`,
        `/proyecto/${projectId}`,
      ),
    );
  }

  // La evaluación se ve en la gestión del proyecto y en el panel del estudiante.
  revalidatePath(`/mis-proyectos/${projectId}`);
  revalidatePath("/mis-postulaciones");
  return { ok: true };
}
