import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site";

/**
 * Envío de correo transaccional (M43) para los mismos 4 eventos que ya
 * generan una notificación in-app (M39): postulación recibida/aceptada/
 * rechazada, invitación a organización y evaluación nueva. Se llama desde
 * las Server Actions que crean cada evento (no desde los triggers de
 * Postgres — no hay `pg_net` habilitado en este proyecto), así que el texto
 * de cada correo se arma en TypeScript, a mano, en el mismo lugar que crea
 * la fila — no se lee de vuelta la notificación que generó el trigger.
 * Nunca lanza: un correo que falla no debe romper la acción que lo originó.
 */

const REMITENTE = { name: "Campuslab", email: "wilnesdevil9@gmail.com" };

function plantilla(mensaje: string, link?: string | null): string {
  const boton = link
    ? `<p style="margin:24px 0 0"><a href="${SITE_URL}${link}" style="background:#3867ff;color:#ffffff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;font-family:sans-serif;font-size:14px">Ver en CampusLab</a></p>`
    : "";
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <p style="font-size:16px;font-weight:700;color:#0b0f19;margin:0">CampusLab</p>
      <p style="font-size:15px;color:#0b0f19;line-height:1.5;margin:16px 0 0">${mensaje}</p>
      ${boton}
    </div>
  `;
}

/** Envía un correo a una dirección directa (invitaciones: el destinatario puede no tener cuenta todavía). */
export async function sendEmail(
  to: string,
  subject: string,
  mensaje: string,
  link?: string | null,
): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("[sendEmail] Falta BREVO_API_KEY en el entorno; correo no enviado.");
    return;
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: REMITENTE,
        to: [{ email: to }],
        subject,
        htmlContent: plantilla(mensaje, link),
      }),
    });

    if (!res.ok) {
      console.error("[sendEmail] Brevo respondió", res.status, await res.text());
    }
  } catch (err) {
    console.error("[sendEmail]", err);
  }
}

/**
 * Envía un correo a un usuario ya registrado, resolviendo su email con el
 * cliente `service_role` (la RLS normal no deja leer `auth.users` ajeno).
 */
export async function sendEmailToUser(
  userId: string,
  subject: string,
  mensaje: string,
  link?: string | null,
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data.user?.email) {
      console.error(
        "[sendEmailToUser] No se pudo resolver el correo del destinatario",
        error?.message,
      );
      return;
    }
    await sendEmail(data.user.email, subject, mensaje, link);
  } catch (err) {
    console.error("[sendEmailToUser]", err);
  }
}
