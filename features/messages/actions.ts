"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/queries";

/**
 * Enviar un mensaje al hilo del proyecto (M30). La RLS
 * `project_messages_insert_participant` es la barrera real: exige ser quien
 * envía (`sender_id = auth.uid()`) y gestionar el proyecto o integrar su
 * equipo. Aquí solo se valida el largo para dar un mensaje de error claro.
 */

export type SendMessageState = { error?: string };

export async function sendMessage(
  _prevState: SendMessageState,
  formData: FormData,
): Promise<SendMessageState> {
  const projectId = String(formData.get("projectId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  // Ruta a revalidar tras enviar: el hilo vive en páginas distintas según el
  // rol (seguimiento del patrocinador, espacio de proyecto del estudiante).
  const redirectPath = String(formData.get("redirectPath") ?? "");

  if (!projectId) return { error: "Falta el proyecto." };
  if (!body) return { error: "Escribe un mensaje." };
  if (body.length > 2000) {
    return { error: "El mensaje es demasiado largo (máximo 2000 caracteres)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Necesitas iniciar sesión." };

  const { error } = await supabase.from("project_messages").insert({
    project_id: projectId,
    sender_id: user.id,
    body,
  });

  if (error) {
    console.error("[sendMessage]", error.message);
    return { error: "No se pudo enviar el mensaje." };
  }

  if (redirectPath) revalidatePath(redirectPath);
  return {};
}

/**
 * Registra en `audit_logs` que un moderador/admin abrió el hilo de mensajes
 * de un proyecto desde un reporte puntual (M99/M100). El acceso de lectura ya
 * lo da la RLS; esto es solo el rastro de quién lo usó y por qué — se llama
 * directo desde la página de solo lectura al montarse (no hay ningún form
 * ni botón: abrir la página YA es la acción a registrar).
 */
export async function logConversationOpened(
  projectId: string,
  reportId: string,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.esModerador && !user?.esAdmin) return;

  const supabase = await createClient();
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: user.id,
    accion: "conversacion_abierta",
    entidad: "project_messages",
    entidad_id: projectId,
    metadata: { report_id: reportId },
  });

  if (error) console.error("[logConversationOpened]", error.message);
}
