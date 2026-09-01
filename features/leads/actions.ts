"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

/**
 * Acción de captación (Fase 1). Registra un lead público en la tabla `leads`:
 * "Hablar con CampusLab" (contacto_organizacion) o "Proponer un desafío"
 * (propuesta_desafio). La RLS `leads_insert_public` (M17) permite el insert
 * anónimo forzando `estado = 'nuevo'`; la lectura queda para moderador/admin.
 */

type LeadTipo = Database["public"]["Enums"]["lead_tipo"];
const TIPOS: readonly LeadTipo[] = [
  "contacto_organizacion",
  "propuesta_desafio",
];

// Validación de correo mínima y tolerante (el formato exacto lo valida el envío).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SubmitLeadState = { ok?: boolean; error?: string };

export async function submitLead(
  _prevState: SubmitLeadState,
  formData: FormData,
): Promise<SubmitLeadState> {
  const tipo = String(formData.get("tipo") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const organizacion = String(formData.get("organizacion") ?? "").trim();
  const mensaje = String(formData.get("mensaje") ?? "").trim();

  if (!TIPOS.includes(tipo as LeadTipo)) {
    return { error: "No se pudo procesar el envío. Recarga e inténtalo de nuevo." };
  }
  if (!nombre) return { error: "Cuéntanos tu nombre." };
  if (!EMAIL_RE.test(email)) return { error: "Ingresa un correo válido." };
  if (!mensaje) return { error: "Describe brevemente tu necesidad o idea." };
  if (mensaje.length > 2000) {
    return { error: "El mensaje es demasiado largo (máximo 2000 caracteres)." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("leads").insert({
    tipo: tipo as LeadTipo,
    nombre,
    email,
    organizacion: organizacion || null,
    mensaje,
  });

  if (error) {
    console.error("[submitLead]", error.message);
    return { error: "No pudimos enviar tu mensaje. Inténtalo de nuevo en un momento." };
  }

  return { ok: true };
}
