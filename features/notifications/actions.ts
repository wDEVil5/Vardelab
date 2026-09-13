"use server";

import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/features/notifications/queries";

/**
 * Acciones de notificaciones (M39). Sin `revalidatePath`: la campanita
 * (`NotificationBell`) actualiza su propio estado local al toque en vez de
 * esperar una recarga — la próxima vez que se cargue el shell desde el
 * servidor, el conteo ya sale al día de todas formas. La RLS
 * `notifications_update_own` acota cada update a las notificaciones propias,
 * así que no hace falta repetir ese filtro acá para estar seguro.
 */

export async function markNotificationRead(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ leida: true })
    .eq("id", id);

  if (error) console.error("[markNotificationRead]", error.message);
}

/**
 * Notificaciones más nuevas que `desde` (ISO), para el sondeo del toast
 * (`NotificationsProvider`). Es una lectura, no una mutación — vive acá (no
 * en `queries.ts`) porque necesita ser una Server Action para poder llamarse
 * desde un componente cliente con `setInterval`; sin Realtime en este
 * proyecto todavía, este sondeo cada ~25s es el reemplazo temporal (queda
 * anotado en BACKEND.md para migrar a una suscripción real más adelante).
 */
export async function checkForNewNotifications(desde: string): Promise<Notification[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("id, tipo, mensaje, link, leida, created_at")
    .eq("user_id", user.id)
    .gt("created_at", desde)
    .order("created_at", { ascending: true })
    .limit(10);

  if (error) {
    console.error("[checkForNewNotifications]", error.message);
    return [];
  }

  return data;
}

export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("notifications")
    .update({ leida: true })
    .eq("user_id", user.id)
    .eq("leida", false);

  if (error) console.error("[markAllNotificationsRead]", error.message);
}
