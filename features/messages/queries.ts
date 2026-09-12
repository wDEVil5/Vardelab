import { createClient } from "@/lib/supabase/server";

/**
 * Mensajería básica por proyecto (M30, S-05): un solo hilo por proyecto, no
 * conversaciones 1:1 ni por hito.
 */

export type ProjectMessage = {
  id: string;
  body: string;
  created_at: string;
  senderId: string | null;
  senderNombre: string | null;
  esMio: boolean;
};

/**
 * Mensajes de un proyecto, del más antiguo al más reciente (orden de lectura).
 * La RLS `project_messages_select_participant` (M30) limita a quien gestiona
 * el proyecto o integra su equipo. Los nombres van en una consulta aparte:
 * `sender_id` referencia `auth.users`, no `profiles`.
 */
export async function getProjectMessages(
  projectId: string,
): Promise<ProjectMessage[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("project_messages")
    .select("id, body, created_at, sender_id")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getProjectMessages]", error.message);
    return [];
  }

  const rows = data ?? [];
  const senderIds = Array.from(
    new Set(rows.map((r) => r.sender_id).filter((id): id is string => !!id)),
  );

  const nombres = new Map<string, string | null>();
  if (senderIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, nombre")
      .in("id", senderIds);
    for (const p of profs ?? []) nombres.set(p.id, p.nombre);
  }

  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    created_at: r.created_at,
    senderId: r.sender_id,
    senderNombre: r.sender_id ? (nombres.get(r.sender_id) ?? null) : null,
    esMio: r.sender_id === user?.id,
  }));
}
