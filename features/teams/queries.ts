import { createClient } from "@/lib/supabase/server";

/**
 * Equipos a los que pertenece el usuario actual, con el proyecto y todos sus
 * integrantes (nombre + rol). Vacío si no está en ninguno. Requiere M14
 * (ver perfiles de compañeros) y M15 (listar el roster del equipo).
 */
export async function getMyTeams() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Equipos en los que soy miembro.
  const { data: mine } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);
  const teamIds = Array.from(new Set((mine ?? []).map((m) => m.team_id)));
  if (teamIds.length === 0) return [];

  // Equipos con su proyecto.
  const { data: teams } = await supabase
    .from("teams")
    .select(
      "id, estado, project:projects ( id, titulo, status, organization:organizations ( nombre ) )",
    )
    .in("id", teamIds);

  // Todos los integrantes de esos equipos (M15 permite verlos).
  const { data: members } = await supabase
    .from("team_members")
    .select("team_id, user_id, role:project_roles ( nombre )")
    .in("team_id", teamIds);

  // Perfiles de los integrantes (M14 permite verlos entre compañeros).
  const userIds = Array.from(new Set((members ?? []).map((m) => m.user_id)));
  const nombres = new Map<string, string | null>();
  if (userIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, nombre")
      .in("id", userIds);
    for (const p of profs ?? []) nombres.set(p.id, p.nombre);
  }

  return (teams ?? []).map((t) => ({
    teamId: t.id,
    estado: t.estado,
    projectId: t.project?.id ?? null,
    projectTitulo: t.project?.titulo ?? "Proyecto",
    projectStatus: t.project?.status ?? null,
    projectOrg: t.project?.organization?.nombre ?? null,
    members: (members ?? [])
      .filter((m) => m.team_id === t.id)
      .map((m) => ({
        userId: m.user_id,
        nombre: nombres.get(m.user_id) ?? "Integrante",
        rol: m.role?.nombre ?? null,
        esYo: m.user_id === user.id,
      })),
  }));
}

export type MyTeam = Awaited<ReturnType<typeof getMyTeams>>[number];
