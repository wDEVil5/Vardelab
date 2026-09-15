"use server";

import { createClient } from "@/lib/supabase/server";

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
