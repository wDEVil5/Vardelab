"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/features/auth/queries";
import type { Database } from "@/types/database.types";
import { sendPlainEmail } from "@/features/notifications/email";

/**
 * Acción de captación (Fase 1). Registra un lead público en la tabla `leads`:
 * "Hablar con Vardelab" (contacto_organizacion) o "Proponer un desafío"
 * (propuesta_desafio). La RLS `leads_insert_public` (M17) permite el insert
 * anónimo forzando `estado = 'nuevo'`; la lectura queda para moderador/admin.
 *
 * M65: hasta acá el lead quedaba solo guardado en la base, sin que nadie se
 * enterara salvo revisando el panel a mano. Al insertar con éxito se manda,
 * por Brevo (`sendPlainEmail`, sin depender de `notification_tipo`): una
 * confirmación a quien escribió (para que sepa que su mensaje llegó) y un
 * aviso interno al correo de Vardelab con el detalle, para no tener que
 * revisar `/leads` a cada rato. Ninguno de los dos bloquea la respuesta al
 * usuario si falla (mismo criterio que el resto de los correos del
 * proyecto): el lead ya quedó guardado, que es lo que importa.
 */

const CONTACTO_VARDELAB = "wilnesdevil9@gmail.com";

type LeadTipo = Database["public"]["Enums"]["lead_tipo"];
const TIPOS = ["contacto_organizacion", "propuesta_desafio"] as const satisfies readonly LeadTipo[];

const TIPO_LABEL: Record<LeadTipo, string> = {
  contacto_organizacion: "Contacto",
  propuesta_desafio: "Propuesta",
};

// Validación de correo mínima y tolerante (el formato exacto lo valida el envío).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// El orden de los campos define el orden en que se revisan: zod junta los
// issues de un `z.object` en el orden del shape, así que `issues[0]` es
// siempre el primer campo inválido, igual que la cadena de `if` que reemplaza.
const SubmitLeadSchema = z.object({
  tipo: z.enum(TIPOS, { error: "No se pudo procesar el envío. Recarga e inténtalo de nuevo." }),
  nombre: z.string().trim().min(1, "Cuéntanos tu nombre."),
  email: z.string().trim().regex(EMAIL_RE, "Ingresa un correo válido."),
  organizacion: z.string().trim(),
  mensaje: z
    .string()
    .trim()
    .min(1, "Describe brevemente tu necesidad o idea.")
    .max(2000, "El mensaje es demasiado largo (máximo 2000 caracteres)."),
});

export type SubmitLeadState = { ok?: boolean; error?: string };

export async function submitLead(
  _prevState: SubmitLeadState,
  formData: FormData,
): Promise<SubmitLeadState> {
  const parsed = SubmitLeadSchema.safeParse({
    tipo: String(formData.get("tipo") ?? ""),
    nombre: String(formData.get("nombre") ?? ""),
    email: String(formData.get("email") ?? ""),
    organizacion: String(formData.get("organizacion") ?? ""),
    mensaje: String(formData.get("mensaje") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { tipo, nombre, email, organizacion, mensaje } = parsed.data;

  const supabase = await createClient();

  const { error } = await supabase.from("leads").insert({
    tipo,
    nombre,
    email,
    organizacion: organizacion || null,
    mensaje,
  });

  if (error) {
    console.error("[submitLead]", error.message);
    return { error: "No pudimos enviar tu mensaje. Inténtalo de nuevo en un momento." };
  }

  await Promise.all([
    sendPlainEmail(email, "Recibimos tu mensaje", `Hola ${nombre}, recibimos tu mensaje y lo vamos a revisar pronto.`, {
      instruccion: "Nuestro equipo te va a contactar a este mismo correo en los próximos días.",
    }),
    sendPlainEmail(
      CONTACTO_VARDELAB,
      `Nuevo lead: ${TIPO_LABEL[tipo]}`,
      `${nombre} (${email})${organizacion ? ` de ${organizacion}` : ""} escribió: "${mensaje}"`,
      { instruccion: "Podés gestionarlo desde el panel de leads.", cta: "Ver leads", link: "/leads" },
    ),
  ]);

  return { ok: true };
}

type LeadEstado = Database["public"]["Enums"]["lead_estado"];
const ESTADOS = ["nuevo", "contactado", "descartado"] as const satisfies readonly LeadEstado[];

const UpdateLeadStatusSchema = z.object({
  leadId: z.string().min(1),
  estado: z.enum(ESTADOS),
});

/**
 * Gestión de un lead (lado del staff): marcarlo contactado, descartado, o
 * devolverlo a nuevo. La RLS `leads_update_staff` (M17) exige moderador/admin;
 * si el usuario no tiene ese rol, Supabase rechaza la actualización.
 */
export async function updateLeadStatus(formData: FormData): Promise<void> {
  const parsed = UpdateLeadStatusSchema.safeParse({
    leadId: String(formData.get("leadId") ?? ""),
    estado: String(formData.get("estado") ?? ""),
  });
  if (!parsed.success) return;
  const { leadId, estado } = parsed.data;

  const supabase = await createClient();

  await requireUser(supabase);

  const { error } = await supabase
    .from("leads")
    .update({ estado })
    .eq("id", leadId);

  if (error) {
    console.error("[updateLeadStatus]", error.message);
    return;
  }

  revalidatePath("/leads");
  revalidatePath("/inicio");
}
