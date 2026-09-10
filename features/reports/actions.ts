"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Acciones de reportes (M7 + M22). Cualquier usuario con sesión puede reportar
 * (`reports_insert_own`, M7); gestionarlos (cambiar estado) queda para
 * moderador/admin (`reports_update_moderator`).
 */

export type SubmitReportState = { ok?: boolean; error?: string };

/**
 * Registra un reporte sobre una entidad (proyecto o perfil). Requiere sesión:
 * la RLS exige `reporter_id = auth.uid()`, así que no hay reporte anónimo.
 */
export async function submitReport(
  _prevState: SubmitReportState,
  formData: FormData,
): Promise<SubmitReportState> {
  const targetType = String(formData.get("targetType") ?? "");
  const targetId = String(formData.get("targetId") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();

  if (!["proyecto", "perfil"].includes(targetType) || !targetId) {
    return { error: "No se pudo procesar el reporte. Recarga e inténtalo de nuevo." };
  }
  if (!motivo) return { error: "Elige un motivo." };
  if (descripcion.length > 1000) {
    return { error: "La descripción es demasiado larga (máximo 1000 caracteres)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    motivo,
    descripcion: descripcion || null,
  });

  if (error) {
    console.error("[submitReport]", error.message);
    return { error: "No se pudo enviar el reporte. Inténtalo de nuevo." };
  }

  return { ok: true };
}

export type ReportActionState = { error?: string };

/** Marca un reporte como en revisión (`abierto → en_revision`). */
export async function markReportInReview(
  _prevState: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  const reportId = String(formData.get("reportId") ?? "");
  if (!reportId) return { error: "Falta el reporte." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .update({ status: "en_revision" })
    .eq("id", reportId)
    .neq("status", "resuelto")
    .select("id");

  if (error) {
    console.error("[markReportInReview]", error.message);
    return { error: "No se pudo actualizar el reporte." };
  }
  if (!data || data.length === 0) {
    return { error: "No se pudo actualizar (¿ya estaba resuelto?)." };
  }

  revalidatePath("/moderacion/reportes");
  revalidatePath(`/moderacion/reportes/${reportId}`);
  return {};
}

/**
 * Resuelve un reporte, con una nota obligatoria: es el registro de qué se hizo
 * (mismo criterio que el motivo de rechazo de proyectos, M21).
 */
export async function resolveReport(
  _prevState: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  const reportId = String(formData.get("reportId") ?? "");
  const resolucion = String(formData.get("resolucion") ?? "").trim();
  if (!reportId) return { error: "Falta el reporte." };
  if (!resolucion) return { error: "Deja una nota de qué se hizo." };
  if (resolucion.length > 1000) {
    return { error: "La nota es demasiado larga (máximo 1000 caracteres)." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .update({ status: "resuelto", resolucion })
    .eq("id", reportId)
    .select("id");

  if (error) {
    console.error("[resolveReport]", error.message);
    return { error: "No se pudo resolver el reporte." };
  }
  if (!data || data.length === 0) {
    return { error: "No se pudo resolver (¿ya no existe?)." };
  }

  revalidatePath("/moderacion/reportes");
  revalidatePath(`/moderacion/reportes/${reportId}`);
  return {};
}
