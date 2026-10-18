"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * Acciones de hitos (lado del patrocinador). La RLS `milestones_write_manager`
 * (M5) exige gestionar el proyecto; aquí se validan los datos.
 */

export type AddMilestoneState = { error?: string; created?: string };

// Orden: opcional, entero ≥ 0. Por defecto 0 (string vacío -> 0 antes de
// chequear el rango, igual que `ordenRaw ? Number(ordenRaw) : 0`).
const OrdenSchema = z
  .string()
  .trim()
  .transform((v) => (v ? Number(v) : 0))
  .refine((n) => Number.isInteger(n) && n >= 0, {
    error: "El orden debe ser un número entero de 0 o más.",
  });

// Mismo orden que la cadena de `if` que reemplaza: projectId, luego título,
// luego orden.
const AddMilestoneSchema = z.object({
  projectId: z.string().min(1, "Falta el proyecto."),
  titulo: z.string().trim().min(1, "El hito necesita un título."),
  descripcion: z.string().trim(),
  fechaLimite: z.string().trim(),
  orden: OrdenSchema,
});

export async function addMilestone(
  _prevState: AddMilestoneState,
  formData: FormData,
): Promise<AddMilestoneState> {
  const parsed = AddMilestoneSchema.safeParse({
    projectId: String(formData.get("projectId") ?? ""),
    titulo: String(formData.get("titulo") ?? ""),
    descripcion: String(formData.get("descripcion") ?? ""),
    fechaLimite: String(formData.get("fecha_limite") ?? ""),
    orden: String(formData.get("orden") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { projectId, titulo, descripcion, fechaLimite, orden } = parsed.data;

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
