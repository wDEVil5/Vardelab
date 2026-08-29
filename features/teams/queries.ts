import { createClient } from "@/lib/supabase/server";

/**
 * Equipo de un proyecto con sus integrantes (nombre, carrera y rol), o `null`
 * si aún no hay equipo. La RLS `teams_select_member_or_manager` /
 * `team_members_select_self_or_manager` (M4) deja verlo al gestor; los perfiles
 * de los integrantes son visibles para el gestor por M13.
 *
 * Los nombres se resuelven en una segunda consulta: `team_members.user_id`
 * referencia `auth.users`, no `profiles`, así que no se puede anidar el perfil.
 */
export async function getProjectTeam(projectId: string) {
  const supabase = await createClient();

  const { data: team, error } = await supabase
    .from("teams")
    .select("id, estado")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) {
    console.error("[getProjectTeam]", error.message);
    throw error;
  }
  if (!team) return null;

  const { data: members } = await supabase
    .from("team_members")
    .select("user_id, contribucion, role:project_roles ( nombre )")
    .eq("team_id", team.id);

  const userIds = (members ?? []).map((m) => m.user_id);
  const perfiles = new Map<string, { nombre: string | null; carrera: string | null }>();
  if (userIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, nombre, carrera")
      .in("id", userIds);
    for (const p of profs ?? []) perfiles.set(p.id, p);
  }

  return {
    estado: team.estado,
    members: (members ?? []).map((m) => ({
      userId: m.user_id,
      nombre: perfiles.get(m.user_id)?.nombre ?? "Integrante",
      carrera: perfiles.get(m.user_id)?.carrera ?? null,
      rol: m.role?.nombre ?? null,
    })),
  };
}

export type ProjectTeam = NonNullable<
  Awaited<ReturnType<typeof getProjectTeam>>
>;

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
    .select("id, estado, project:projects ( id, titulo )")
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
