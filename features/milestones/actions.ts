"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Acciones de hitos (lado del patrocinador). La RLS `milestones_write_manager`
 * (M5) exige gestionar el proyecto; aquí se validan los datos.
 */

export type AddMilestoneState = { error?: string };

export async function addMilestone(
  _prevState: AddMilestoneState,
  formData: FormData,
): Promise<AddMilestoneState> {
  const projectId = String(formData.get("projectId") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const fechaLimite = String(formData.get("fecha_limite") ?? "").trim();
  const ordenRaw = String(formData.get("orden") ?? "").trim();

  if (!projectId) return { error: "Falta el proyecto." };
  if (!titulo) return { error: "El hito necesita un título." };

  // Orden: opcional, entero ≥ 0. Por defecto 0.
  const orden = ordenRaw ? Number(ordenRaw) : 0;
  if (!Number.isInteger(orden) || orden < 0) {
    return { error: "El orden debe ser un número entero de 0 o más." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("milestones").insert({
    project_id: projectId,
    titulo,
    descripcion: descripcion || null,
    fecha_limite: fechaLimite || null,
    orden,
  });

  if (error) {
    console.error("[addMilestone]", error.message);
    return { error: "No se pudo agregar el hito. Inténtalo de nuevo." };
  }

  revalidatePath(`/mis-proyectos/${projectId}`);
  return {};
}

/** Elimina un hito. La RLS restringe a quien gestiona el proyecto. */
export async function deleteMilestone(formData: FormData): Promise<void> {
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!milestoneId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("milestones")
    .delete()
    .eq("id", milestoneId);

  if (error) console.error("[deleteMilestone]", error.message);

  revalidatePath(`/mis-proyectos/${projectId}`);
}
