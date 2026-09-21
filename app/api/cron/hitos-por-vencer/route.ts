import { NextResponse, type NextRequest } from "next/server";
import { sendEmailToUser } from "@/features/notifications/email";

/**
 * Webhook que dispara `notificar_hitos_por_vencer()` (M97, `pg_net`) después
 * de insertar las notificaciones in-app de "hito por vencer" — una función
 * `plpgsql` de `pg_cron` no puede hablar HTTP por sí sola, así que le pasa el
 * payload ya armado (a quién avisar y con qué texto) para que esta ruta
 * reuse `sendEmailToUser` y la plantilla real, sin duplicar nada en SQL.
 *
 * Protegido con un secreto compartido (`CRON_WEBHOOK_SECRET`, igual en la
 * app y en `app.settings.cron_webhook_secret` de Postgres): sin esto,
 * cualquiera podría invocar la ruta y mandar correos arbitrarios en nombre
 * del sistema.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_WEBHOOK_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const items = body?.items;
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  await Promise.all(
    items.map((item: { userId: string; mensaje: string; link?: string }) =>
      sendEmailToUser(item.userId, "hito_por_vencer", item.mensaje, item.link),
    ),
  );

  return NextResponse.json({ ok: true, enviados: items.length });
}
