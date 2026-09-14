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

/**
 * Nombre de cada posible participante del hilo (equipo del proyecto + dueño y
 * miembros activos de la organización que lo gestiona), sin depender de que ya
 * hayan escrito antes. Sirve para el hilo en vivo (M49): un mensaje nuevo que
 * llega por Realtime solo trae `sender_id` en la fila, no el nombre — con este
 * mapa ya resuelto de antemano, no hace falta una consulta extra por mensaje.
 */
export async function getProjectParticipantNames(
  projectId: string,
): Promise<Record<string, string>> {
  const supabase = await createClient();

  const { data: proyecto } = await supabase
    .from("projects")
    .select("org_id")
    .eq("id", projectId)
    .maybeSingle();

  const ids = new Set<string>();

  const { data: equipos } = await supabase
    .from("teams")
    .select("id")
    .eq("project_id", projectId);
  const teamIds = (equipos ?? []).map((t) => t.id);
  if (teamIds.length > 0) {
    const { data: miembros } = await supabase
      .from("team_members")
      .select("user_id")
      .in("team_id", teamIds);
    for (const m of miembros ?? []) ids.add(m.user_id);
  }

  if (proyecto?.org_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("owner_id")
      .eq("id", proyecto.org_id)
      .maybeSingle();
    if (org?.owner_id) ids.add(org.owner_id);

    const { data: miembrosOrg } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("org_id", proyecto.org_id)
      .eq("status", "activo");
    for (const m of miembrosOrg ?? []) if (m.user_id) ids.add(m.user_id);
  }

  if (ids.size === 0) return {};

  const { data: perfiles } = await supabase
    .from("profiles")
    .select("id, nombre")
    .in("id", Array.from(ids));

  const nombres: Record<string, string> = {};
  for (const p of perfiles ?? []) {
    if (p.nombre) nombres[p.id] = p.nombre;
  }
  return nombres;
}
