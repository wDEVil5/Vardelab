"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/features/auth/queries";
import { getMyOrgIds } from "@/features/organizations/queries";
import { sendEmailToUser } from "@/features/notifications/email";

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

  if (!["proyecto", "perfil", "organizacion"].includes(targetType) || !targetId) {
    return { error: "No se pudo procesar el reporte. Recarga e inténtalo de nuevo." };
  }
  if (!motivo) return { error: "Elige un motivo." };
  if (descripcion.length > 1000) {
    return { error: "La descripción es demasiado larga (máximo 1000 caracteres)." };
  }

  const supabase = await createClient();
  const user = await requireUser(supabase);

  if (targetType === "perfil" && targetId === user.id) {
    return { error: "No puedes reportar tu propio perfil." };
  }

  // El botón ya se oculta para lo propio en la UI, pero eso no frena un POST
  // directo a esta acción — el chequeo real tiene que vivir acá.
  if (targetType === "organizacion") {
    const misOrgIds = await getMyOrgIds();
    if (misOrgIds.includes(targetId)) {
      return { error: "No puedes reportar tu propia organización." };
    }
  }

  if (targetType === "proyecto") {
    const misOrgIds = await getMyOrgIds();
    if (misOrgIds.length > 0) {
      const { data: proyecto } = await supabase
        .from("projects")
        .select("org_id")
        .eq("id", targetId)
        .maybeSingle();
      if (proyecto && misOrgIds.includes(proyecto.org_id)) {
        return { error: "No puedes reportar tu propio proyecto." };
      }
    }
  }

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
 * Escala un reporte a admin (M93): el moderador deja una nota de por qué no
 * lo resuelve él mismo. No cambia `status` — un admin ya puede leer y
 * resolver cualquier reporte, esto solo le avisa (trigger
 * `notify_reporte_escalado`) que este caso puntual lo necesita a él.
 */
export async function escalateReport(
  _prevState: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  const reportId = String(formData.get("reportId") ?? "");
  const nota = String(formData.get("nota") ?? "").trim();
  if (!reportId) return { error: "Falta el reporte." };
  if (!nota) return { error: "Deja una nota de por qué lo escalas." };
  if (nota.length > 1000) {
    return { error: "La nota es demasiado larga (máximo 1000 caracteres)." };
  }

  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { data, error } = await supabase
    .from("reports")
    .update({
      escalado_admin: true,
      escalado_nota: nota,
      escalado_por: user.id,
      escalado_at: new Date().toISOString(),
    })
    .eq("id", reportId)
    .eq("escalado_admin", false)
    .neq("status", "resuelto")
    .select("id");

  if (error) {
    console.error("[escalateReport]", error.message);
    return { error: "No se pudo escalar el reporte." };
  }
  if (!data || data.length === 0) {
    return { error: "No se pudo escalar (¿ya estaba escalado o resuelto?)." };
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
    .select("id, reporter_id, motivo");

  if (error) {
    console.error("[resolveReport]", error.message);
    return { error: "No se pudo resolver el reporte." };
  }
  if (!data || data.length === 0) {
    return { error: "No se pudo resolver (¿ya no existe?)." };
  }

  // La notificación in-app la crea el trigger `notify_reporte_resuelto`
  // (M95); el correo se manda desde acá porque esta sí es una Server Action
  // (no como M91/M93, triggers sin caller por no tener pg_net habilitado).
  const [resolved] = data;
  if (resolved.reporter_id) {
    after(() =>
      sendEmailToUser(
        resolved.reporter_id!,
        "reporte_resuelto",
        `Tu reporte sobre "${resolved.motivo}" fue resuelto.`,
        "/mis-reportes",
      ),
    );
  }

  revalidatePath("/moderacion/reportes");
  revalidatePath(`/moderacion/reportes/${reportId}`);
  return {};
}
