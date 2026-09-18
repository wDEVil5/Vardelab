"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Acciones de hitos (lado del patrocinador). La RLS `milestones_write_manager`
 * (M5) exige gestionar el proyecto; aquí se validan los datos.
 */

export type AddMilestoneState = { error?: string; created?: string };

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
  return { created: titulo };
}

export type MilestoneActionState = { error?: string };

/**
 * Aprueba un hito entregado (`entregado → aprobado`). Solo transiciona desde
 * `entregado`: no se aprueba un hito sin entrega ni se reabre uno ya cerrado. La
 * RLS `milestones_write_manager` (M5) limita la escritura al gestor del proyecto.
 */
export async function approveMilestone(
  _prevState: MilestoneActionState,
  formData: FormData,
): Promise<MilestoneActionState> {
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!milestoneId) return { error: "Falta el hito." };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("milestones")
    .update({ estado: "aprobado" }, { count: "exact" })
    .eq("id", milestoneId)
    .eq("estado", "entregado");

  if (error) {
    console.error("[approveMilestone]", error.message);
    return { error: "No se pudo aprobar el hito. Inténtalo de nuevo." };
  }
  if (!count) {
    return { error: "Este hito ya no está entregado — puede que alguien más ya lo haya procesado." };
  }

  revalidatePath(`/mis-proyectos/${projectId}`);
  return {};
}

/**
 * Devuelve un hito entregado para correcciones (`entregado → en_progreso`). El
 * equipo lo verá como "pedido de cambios"; al re-entregar, el trigger de M16 lo
 * vuelve a `entregado`. Solo actúa desde `entregado`.
 */
export async function returnMilestone(
  _prevState: MilestoneActionState,
  formData: FormData,
): Promise<MilestoneActionState> {
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!milestoneId) return { error: "Falta el hito." };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("milestones")
    .update({ estado: "en_progreso" }, { count: "exact" })
    .eq("id", milestoneId)
    .eq("estado", "entregado");

  if (error) {
    console.error("[returnMilestone]", error.message);
    return { error: "No se pudo devolver el hito. Inténtalo de nuevo." };
  }
  if (!count) {
    return { error: "Este hito ya no está entregado — puede que alguien más ya lo haya procesado." };
  }

  revalidatePath(`/mis-proyectos/${projectId}`);
  return {};
}

/** Elimina un hito. La RLS restringe a quien gestiona el proyecto. */
export async function deleteMilestone(
  _prevState: MilestoneActionState,
  formData: FormData,
): Promise<MilestoneActionState> {
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!milestoneId) return { error: "Falta el hito." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("milestones")
    .delete()
    .eq("id", milestoneId);

  if (error) {
    console.error("[deleteMilestone]", error.message);
    return { error: "No se pudo eliminar el hito. Inténtalo de nuevo." };
  }

  revalidatePath(`/mis-proyectos/${projectId}`);
  return {};
}
