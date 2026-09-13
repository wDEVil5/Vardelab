import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site";
import type { Notification } from "@/features/notifications/queries";

/**
 * Envío de correo transaccional (M43/M44) para los mismos 4 eventos que ya
 * generan una notificación in-app (M39): postulación recibida/aceptada/
 * rechazada, invitación a organización y evaluación nueva. Se llama desde
 * las Server Actions que crean cada evento (no desde los triggers de
 * Postgres — no hay `pg_net` habilitado en este proyecto), así que el texto
 * de cada correo se arma en TypeScript, a mano, en el mismo lugar que crea
 * la fila — no se lee de vuelta la notificación que generó el trigger.
 * Nunca lanza: un correo que falla no debe romper la acción que lo originó.
 *
 * La plantilla es deliberadamente austera: un solo acento (electric, solo en
 * el CTA), sin pills de color, sin barras, sin frases de misión — wordmark
 * de texto, una etiqueta chica en gris, título, dos líneas de cuerpo y un
 * botón. El objetivo es que se sienta escrito por una persona, no generado.
 */

const REMITENTE = { name: "Campuslab", email: "wilnesdevil9@gmail.com" };

type Tipo = Notification["tipo"];

const CATALOGO: Record<
  Tipo,
  { asunto: string; etiqueta: string; instruccion: string; cta: string; confianza?: string }
> = {
  postulacion_recibida: {
    asunto: "Nueva postulación recibida",
    etiqueta: "Postulación",
    instruccion: "Puedes revisar su perfil y decidir si avanza.",
    cta: "Ver postulación",
  },
  postulacion_aceptada: {
    asunto: "Tu postulación fue aceptada",
    etiqueta: "Postulación aceptada",
    instruccion: "Coordina los próximos pasos con la organización desde tu panel.",
    cta: "Ver mi postulación",
  },
  postulacion_rechazada: {
    asunto: "Actualización sobre tu postulación",
    etiqueta: "Postulación",
    instruccion: "Puedes seguir explorando otros proyectos disponibles.",
    cta: "Ver mis postulaciones",
  },
  invitacion_organizacion: {
    asunto: "Te invitaron a una organización",
    etiqueta: "Invitación",
    instruccion:
      "Vas a poder editar proyectos, revisar postulaciones y coordinar el equipo junto al resto de quienes gestionan la organización.",
    cta: "Ver invitación",
    confianza: "Si no esperabas esta invitación, puedes ignorar este correo.",
  },
  evaluacion_nueva: {
    asunto: "Recibiste una evaluación",
    etiqueta: "Evaluación",
    instruccion: "Revisa el detalle y los comentarios en tu espacio de trabajo.",
    cta: "Ver evaluación",
  },
  hito_por_vencer: {
    asunto: "Un hito está por vencer",
    etiqueta: "Hito",
    instruccion: "Revisa el avance del equipo antes de la fecha límite.",
    cta: "Ver hito",
  },
};

// Documento completo (no solo un fragmento): así entran los <meta> de
// color-scheme, que son lo que le permite a Apple Mail / Outlook.com
// adaptar la plantilla en modo oscuro sin que el texto oscuro quede
// ilegible sobre un fondo que el cliente oscureció por su cuenta.
function plantilla(tipo: Tipo, mensaje: string, link?: string | null): string {
  const { asunto, etiqueta, instruccion, cta, confianza } = CATALOGO[tipo];
  const fuente = "-apple-system,BlinkMacSystemFont,'Inter',Helvetica,Arial,sans-serif";

  const boton = link
    ? `<a href="${SITE_URL}${link}" style="display:inline-block;background:#3867ff;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;font-family:${fuente}">${cta}</a>`
    : "";

  const lineaConfianza = confianza
    ? `<p class="muted" style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#607086">${confianza}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<style>
  body { margin:0; padding:0; }
  @media (prefers-color-scheme: dark) {
    .bg-outer { background:#0b0f19 !important; }
    .bg-card { background:#141b26 !important; border-color:#262f3d !important; }
    .ink { color:#f3f5f8 !important; }
    .muted { color:#93a1b3 !important; }
    .borde { border-color:#262f3d !important; }
  }
</style>
</head>
<body class="bg-outer" style="margin:0;padding:0;background:#f3f5f8">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="bg-outer" style="background:#f3f5f8">
    <tr>
      <td align="center" style="padding:40px 20px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
          <tr>
            <td class="bg-card" style="background:#ffffff;border:1px solid #e3e8ee;border-radius:12px;padding:40px;font-family:${fuente}">
              <p class="ink" style="margin:0 0 32px;font-size:15px;font-weight:700;color:#0d253b">CampusLab</p>
              <p class="muted" style="margin:0 0 12px;font-size:12px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;color:#607086">${etiqueta}</p>
              <h1 class="ink" style="margin:0 0 16px;font-size:20px;line-height:1.35;font-weight:700;color:#0d253b">${asunto}</h1>
              <p class="ink" style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#0d253b">${mensaje}</p>
              <p class="ink" style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#0d253b">${instruccion}</p>
              ${boton}
              ${lineaConfianza}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 8px 0">
              <p class="muted" style="margin:0;font-size:12px;line-height:1.6;color:#607086">
                CampusLab · Microproyectos reales entre estudiantes y organizaciones<br>
                <a href="${SITE_URL}/contacto" class="muted" style="color:#607086;text-decoration:underline">Contacto</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Envía un correo a una dirección directa (invitaciones: el destinatario puede no tener cuenta todavía). */
export async function sendEmail(
  to: string,
  tipo: Tipo,
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
        subject: CATALOGO[tipo].asunto,
        htmlContent: plantilla(tipo, mensaje, link),
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
  tipo: Tipo,
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
    await sendEmail(data.user.email, tipo, mensaje, link);
  } catch (err) {
    console.error("[sendEmailToUser]", err);
  }
}
