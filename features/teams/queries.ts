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
