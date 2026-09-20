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
 *
 * `sendPlainEmail` (M65) reusa la misma plantilla y el mismo envío por Brevo
 * para casos que no son un `notification_tipo` — el canal de contacto
 * (leads) es el primero — sin pasar por `CATALOGO`, que sigue acoplado al
 * enum de notificaciones a propósito (cada entrada ahí es un evento in-app
 * real, no un catálogo de correos genérico).
 */

const REMITENTE = { name: "Vardelab", email: "wilnesdevil9@gmail.com" };

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
  // Sin caller todavía (M60 genera la notificación in-app desde un trigger de
  // Postgres, no desde una Server Action) — mismo caso que `mensaje_nuevo`.
  proyecto_cancelado: {
    asunto: "Un proyecto fue cancelado",
    instruccion: "Puedes revisar el detalle o seguir explorando otros proyectos.",
    cta: "Ver proyecto",
  },
  // Sin caller todavía (M91 genera la notificación in-app desde un trigger
  // de Postgres, no desde una Server Action) — mismo caso que `mensaje_nuevo`.
  proyecto_rechazado: {
    asunto: "Un moderador pidió cambios en tu proyecto",
    instruccion: "Revisa el motivo y las observaciones antes de reenviarlo a revisión.",
    cta: "Ver proyecto",
  },
  organizacion_verificada: {
    asunto: "Tu organización fue verificada",
    instruccion: "El sello de verificada ya es visible en tu perfil público y tus proyectos.",
    cta: "Ver mi organización",
  },
  organizacion_no_verificada: {
    asunto: "Tu solicitud de verificación no fue aprobada",
    instruccion: "Puedes revisar los datos de tu organización y volver a solicitarla.",
    cta: "Ver mi organización",
  },
  postulacion_removida: {
    asunto: "Cambios en tu equipo de proyecto",
    instruccion: "Puedes seguir explorando otros proyectos disponibles.",
    cta: "Ver mis postulaciones",
  },
  // Sin caller todavía (M93 genera la notificación in-app desde un trigger
  // de Postgres, no desde una Server Action) — mismo caso que
  // `mensaje_nuevo`.
  reporte_escalado: {
    asunto: "Un moderador escaló un reporte",
    instruccion: "Revisa el caso y decide cómo resolverlo.",
    cta: "Ver reporte",
  },
  // Sin caller todavía (M95 genera la notificación in-app desde un trigger
  // de Postgres, no desde una Server Action) — a diferencia de
  // `reporte_resuelto`, este va al staff, que ya revisa el panel de
  // moderación activamente.
  reporte_recibido: {
    asunto: "Nuevo reporte recibido",
    instruccion: "Revisa el caso desde la cola de reportes.",
    cta: "Ver reporte",
  },
  reporte_resuelto: {
    asunto: "Tu reporte fue resuelto",
    instruccion: "Puedes ver el detalle desde tu panel.",
    cta: "Ver mis reportes",
  },
};

type PlantillaConfig = {
  asunto: string;
  mensaje: string;
  instruccion: string;
  cta?: string;
  link?: string | null;
  confianza?: string;
  to: string;
};

// Documento completo (no solo un fragmento): así entran los <meta> de
// color-scheme, que son lo que le permite a Apple Mail / Outlook.com
// adaptar la plantilla en modo oscuro sin que el texto oscuro quede
// ilegible sobre un fondo que el cliente oscureció por su cuenta.
//
// Genérica a propósito (no recibe `Tipo`): la usan tanto los correos de
// notificaciones (vía `CATALOGO`, abajo) como el canal de contacto (leads),
// que no es un evento de `notification_tipo` y arma su propio asunto/cuerpo.
function plantilla({ asunto, mensaje, instruccion, cta, link, confianza, to }: PlantillaConfig): string {
  const fuente = "-apple-system,BlinkMacSystemFont,'Inter',Helvetica,Arial,sans-serif";

  const boton = link
    ? `<a href="${SITE_URL}${link}" style="display:inline-block;background:#3867ff;color:#ffffff;font-size:15px;font-weight:700;padding:15px 36px;border-radius:8px;text-decoration:none;font-family:${fuente}">${cta ?? "Ver más"}</a>`
    : "";

  const lineaConfianza = confianza
    ? `<p class="muted" style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#607086">${confianza}</p>`
    : "";

  // Texto de dominio para mostrar (sin protocolo, como "www.brevo.com" en el
  // mockup de referencia): usa `SITE_URL` tal cual, así que en cuanto cambie
  // el dominio (o el nombre "Vardelab") esta línea se actualiza sola.
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
  .logo-dark { display:none; }
  @media (prefers-color-scheme: dark) {
    .bg-outer { background:#0b0f19 !important; }
    .ink { color:#f3f5f8 !important; }
    .muted { color:#93a1b3 !important; }
    .borde { border-color:#262f3d !important; }
    .logo-light { display:none !important; }
    .logo-dark { display:inline-block !important; }
  }
</style>
</head>
<body class="bg-outer" style="margin:0;padding:0;background:#f3f5f8">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="bg-outer" style="background:#f3f5f8">
    <tr>
      <td align="center" style="padding:56px 24px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;font-family:${fuente};text-align:center">
          <tr>
            <td style="padding:0 0 32px">
              <!-- Dos <img> fijas, no una con src dinámico: un correo no puede
                   cambiar el src por JS según el tema. El CSS de arriba oculta
                   una y muestra la otra en dark mode. -->
              <img class="logo-light" src="${SITE_URL}/brand/email-logo.png" width="105" height="22" alt="Vardelab" style="display:inline-block;border:0;outline:none;height:22px;width:105px">
              <img class="logo-dark" src="${SITE_URL}/brand/email-logo-dark.png" width="105" height="22" alt="Vardelab" style="border:0;outline:none;height:22px;width:105px">
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 24px;font-size:26px;line-height:1.3;font-weight:800;letter-spacing:-.01em;color:#3867ff">${asunto}</td>
          </tr>
          <tr>
            <td class="ink" style="padding:0 0 20px;font-size:16px;line-height:1.7;color:#0d253b">${mensaje}</td>
          </tr>
          ${instruccion ? `<tr><td class="muted" style="padding:0 0 40px;font-size:15px;line-height:1.7;color:#607086">${instruccion}</td></tr>` : ""}
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
              Vardelab · Microproyectos reales entre estudiantes y organizaciones<br>
              Este correo se envió a ${to}.<br>
              <a href="${SITE_URL}/contacto" class="muted" style="color:#607086;text-decoration:underline">Contacto</a>
            </td>
          </tr>
          <tr>
            <td class="muted" style="padding:16px 0 0;font-size:12px;line-height:1.6;color:#607086">
              ¿No conoces Vardelab? Más información en
              <a href="${SITE_URL}" class="muted" style="color:#607086;text-decoration:underline">${dominioVisible}</a>
            </td>
          </tr>
          <tr>
            <td class="muted" style="padding:28px 0 0;font-size:12px;font-weight:700;color:#607086">Vardelab</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Llamada de bajo nivel a la API de Brevo, sin conocer `notification_tipo` ni el catálogo — la comparten `sendEmail` y `sendPlainEmail`. Nunca lanza: un correo que falla no debe romper la acción que lo originó. */
async function enviarPorBrevo(to: string, asunto: string, html: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("[enviarPorBrevo] Falta BREVO_API_KEY en el entorno; correo no enviado.");
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
        subject: asunto,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      console.error("[enviarPorBrevo] Brevo respondió", res.status, await res.text());
    }
  } catch (err) {
    console.error("[enviarPorBrevo]", err);
  }
}

/** Envía un correo a una dirección directa (invitaciones: el destinatario puede no tener cuenta todavía). */
export async function sendEmail(
  to: string,
  tipo: Tipo,
  mensaje: string,
  link?: string | null,
): Promise<void> {
  const { asunto, instruccion, cta, confianza } = CATALOGO[tipo];
  await enviarPorBrevo(to, asunto, plantilla({ asunto, mensaje, instruccion, cta, confianza, link, to }));
}

/**
 * Correo genérico, sin pasar por `notification_tipo` (features/notifications/queries.ts) ni
 * `CATALOGO`: para el canal de contacto (leads) y cualquier otro caso que no
 * sea uno de los eventos de notificación in-app. Misma plantilla visual.
 */
export async function sendPlainEmail(
  to: string,
  asunto: string,
  mensaje: string,
  opts?: { instruccion?: string; cta?: string; link?: string | null },
): Promise<void> {
  await enviarPorBrevo(
    to,
    asunto,
    plantilla({ asunto, mensaje, instruccion: opts?.instruccion ?? "", cta: opts?.cta, link: opts?.link, to }),
  );
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
