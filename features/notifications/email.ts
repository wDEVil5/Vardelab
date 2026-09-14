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
 * La plantilla (v4) es plana, sin tarjeta ni bordes: wordmark centrado
 * arriba, un título grande en el color de marca, cuerpo centrado con
 * bastante aire entre líneas, un botón grande, y un pie con divisor fino que
 * indica a quién se envió el correo. Sin pills, sin barras decorativas, sin
 * frases de misión — todo el color queda en el título y el botón.
 */

const REMITENTE = { name: "Campuslab", email: "wilnesdevil9@gmail.com" };

type Tipo = Notification["tipo"];

const CATALOGO: Record<
  Tipo,
  { asunto: string; instruccion: string; cta: string; confianza?: string }
> = {
  postulacion_recibida: {
    asunto: "Nueva postulación recibida",
    instruccion: "Puedes revisar su perfil y decidir si avanza.",
    cta: "Ver postulación",
  },
  postulacion_aceptada: {
    asunto: "Tu postulación fue aceptada",
    instruccion: "Coordina los próximos pasos con la organización desde tu panel.",
    cta: "Ver mi postulación",
  },
  postulacion_rechazada: {
    asunto: "Actualización sobre tu postulación",
    instruccion: "Puedes seguir explorando otros proyectos disponibles.",
    cta: "Ver mis postulaciones",
  },
  invitacion_organizacion: {
    asunto: "Te invitaron a una organización",
    instruccion:
      "Vas a poder editar proyectos, revisar postulaciones y coordinar el equipo junto al resto de quienes gestionan la organización.",
    cta: "Ver invitación",
    confianza: "Si no esperabas esta invitación, puedes ignorar este correo.",
  },
  evaluacion_nueva: {
    asunto: "Recibiste una evaluación",
    instruccion: "Revisa el detalle y los comentarios en tu espacio de trabajo.",
    cta: "Ver evaluación",
  },
  hito_por_vencer: {
    asunto: "Un hito está por vencer",
    instruccion: "Revisa el avance del equipo antes de la fecha límite.",
    cta: "Ver hito",
  },
  // Sin caller todavía (M53 genera la notificación in-app desde un trigger
  // de Postgres, no desde una Server Action) — mismo caso que
  // `hito_por_vencer`. Queda completo el catálogo para cuando se conecte.
  mensaje_nuevo: {
    asunto: "Tienes un mensaje nuevo",
    instruccion: "Respóndele desde el proyecto para no perder el hilo.",
    cta: "Ver mensaje",
  },
};

// Documento completo (no solo un fragmento): así entran los <meta> de
// color-scheme, que son lo que le permite a Apple Mail / Outlook.com
// adaptar la plantilla en modo oscuro sin que el texto oscuro quede
// ilegible sobre un fondo que el cliente oscureció por su cuenta.
function plantilla(tipo: Tipo, mensaje: string, link: string | null | undefined, to: string): string {
  const { asunto, instruccion, cta, confianza } = CATALOGO[tipo];
  const fuente = "-apple-system,BlinkMacSystemFont,'Inter',Helvetica,Arial,sans-serif";

  const boton = link
    ? `<a href="${SITE_URL}${link}" style="display:inline-block;background:#3867ff;color:#ffffff;font-size:15px;font-weight:700;padding:15px 36px;border-radius:8px;text-decoration:none;font-family:${fuente}">${cta}</a>`
    : "";

  const lineaConfianza = confianza
    ? `<p class="muted" style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#607086">${confianza}</p>`
    : "";

  // Texto de dominio para mostrar (sin protocolo, como "www.brevo.com" en el
  // mockup de referencia): usa `SITE_URL` tal cual, así que en cuanto cambie
  // el dominio (o el nombre "CampusLab") esta línea se actualiza sola.
  const dominioVisible = SITE_URL.replace(/^https?:\/\//, "");

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
    .ink { color:#f3f5f8 !important; }
    .muted { color:#93a1b3 !important; }
    .borde { border-color:#262f3d !important; }
  }
</style>
</head>
<body class="bg-outer" style="margin:0;padding:0;background:#f3f5f8">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="bg-outer" style="background:#f3f5f8">
    <tr>
      <td align="center" style="padding:56px 24px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;font-family:${fuente};text-align:center">
          <tr>
            <td class="ink" style="padding:0 0 40px;font-size:22px;font-weight:800;letter-spacing:-.01em;color:#0d253b">CampusLab</td>
          </tr>
          <tr>
            <td style="padding:0 0 24px;font-size:26px;line-height:1.3;font-weight:800;letter-spacing:-.01em;color:#3867ff">${asunto}</td>
          </tr>
          <tr>
            <td class="ink" style="padding:0 0 20px;font-size:16px;line-height:1.7;color:#0d253b">${mensaje}</td>
          </tr>
          <tr>
            <td class="muted" style="padding:0 0 40px;font-size:15px;line-height:1.7;color:#607086">${instruccion}</td>
          </tr>
          ${boton ? `<tr><td style="padding:0 0 8px">${boton}</td></tr>` : ""}
          ${lineaConfianza ? `<tr><td>${lineaConfianza}</td></tr>` : ""}
          <tr>
            <td style="padding-top:56px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td class="borde" style="border-top:1px solid #e3e8ee;font-size:0;line-height:0">&nbsp;</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="muted" style="padding:20px 0 0;font-size:12px;line-height:1.7;color:#607086">
              CampusLab · Microproyectos reales entre estudiantes y organizaciones<br>
              Este correo se envió a ${to}.<br>
              <a href="${SITE_URL}/contacto" class="muted" style="color:#607086;text-decoration:underline">Contacto</a>
            </td>
          </tr>
          <tr>
            <td class="muted" style="padding:16px 0 0;font-size:12px;line-height:1.6;color:#607086">
              ¿No conoces CampusLab? Más información en
              <a href="${SITE_URL}" class="muted" style="color:#607086;text-decoration:underline">${dominioVisible}</a>
            </td>
          </tr>
          <tr>
            <td class="muted" style="padding:28px 0 0;font-size:12px;font-weight:700;color:#607086">CampusLab</td>
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
        htmlContent: plantilla(tipo, mensaje, link, to),
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
