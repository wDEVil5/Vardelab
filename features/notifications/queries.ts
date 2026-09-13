import { createClient } from "@/lib/supabase/server";

/**
 * Notificaciones del usuario actual (M39), las más recientes primero. Se usa
 * tanto para el conteo de no leídas como para la lista del panel de la
 * campanita — un único fetch, sin necesidad de dos consultas separadas.
 */
export async function getMyNotifications(limit = 15) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("id, tipo, mensaje, link, leida, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getMyNotifications]", error.message);
    return [];
  }

  return data;
}

export type Notification = Awaited<ReturnType<typeof getMyNotifications>>[number];

/** Cantidad de notificaciones sin leer del usuario actual, para el badge de la campanita. */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("leida", false);

  if (error) {
    console.error("[getUnreadNotificationCount]", error.message);
    return 0;
  }

  return count ?? 0;
}
