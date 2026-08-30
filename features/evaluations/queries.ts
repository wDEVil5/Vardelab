import { createClient } from "@/lib/supabase/server";

/**
 * Capa de datos de evaluaciones. El gestor del proyecto evalúa a cada integrante
 * de su equipo; la evaluación es privada (RLS `evaluations_select_involved_or_manager`
 * de M6): la ven el evaluado, el evaluador y el gestor, nadie más.
 */

/**
 * Integrantes del equipo de un proyecto junto con la evaluación que el gestor
 * actual ya les puso (si existe), para pintar el panel de evaluación. `null` si
 * el proyecto aún no tiene equipo.
 *
 * Los nombres van en una consulta aparte: `team_members.user_id` referencia
 * `auth.users`, no `profiles`, así que no se puede anidar el perfil. Igual con
 * las evaluaciones, que se resuelven por `evaluatee_id` y se cruzan en memoria.
 */
export type MemberEvaluation = {
  userId: string;
  nombre: string;
  carrera: string | null;
  rol: string | null;
  // Evaluación de este integrante por el gestor actual, si ya existe.
  puntaje: number | null;
  comentario: string | null;
};

export async function getTeamForEvaluation(
  projectId: string,
): Promise<MemberEvaluation[] | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Equipo del proyecto.
  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();
  if (!team) return null;

  // Integrantes con su rol.
  const { data: members } = await supabase
    .from("team_members")
    .select("user_id, role:project_roles ( nombre )")
    .eq("team_id", team.id);
  if (!members || members.length === 0) return [];

  const userIds = members.map((m) => m.user_id);

  // Perfiles (nombre + carrera) y evaluaciones del gestor actual, en paralelo.
  const [{ data: profs }, { data: evals }] = await Promise.all([
    supabase.from("profiles").select("id, nombre, carrera").in("id", userIds),
    supabase
      .from("evaluations")
      .select("evaluatee_id, puntaje, comentario")
      .eq("project_id", projectId)
      .eq("evaluator_id", user.id),
  ]);

  const perfiles = new Map<string, { nombre: string | null; carrera: string | null }>();
  for (const p of profs ?? []) perfiles.set(p.id, p);

  const evaluaciones = new Map<string, { puntaje: number | null; comentario: string | null }>();
  for (const e of evals ?? []) evaluaciones.set(e.evaluatee_id, e);

  return members.map((m) => ({
    userId: m.user_id,
    nombre: perfiles.get(m.user_id)?.nombre ?? "Integrante",
    carrera: perfiles.get(m.user_id)?.carrera ?? null,
    rol: m.role?.nombre ?? null,
    puntaje: evaluaciones.get(m.user_id)?.puntaje ?? null,
    comentario: evaluaciones.get(m.user_id)?.comentario ?? null,
  }));
}

/**
 * Evaluaciones que el usuario actual recibió, indexadas por proyecto. La RLS
 * `evaluations_select_involved_or_manager` (M6) deja al evaluado ver las suyas.
 * Un proyecto tiene a lo sumo una (un gestor por proyecto), así que se devuelve
 * un Map project_id → { puntaje, comentario } para cruzar con los equipos.
 */
export type MyEvaluation = { puntaje: number | null; comentario: string | null };

export async function getMyEvaluationsByProject(): Promise<Map<string, MyEvaluation>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Map();

  const { data, error } = await supabase
    .from("evaluations")
    .select("project_id, puntaje, comentario")
    .eq("evaluatee_id", user.id);

  if (error) {
    console.error("[getMyEvaluationsByProject]", error.message);
    return new Map();
  }

  const map = new Map<string, MyEvaluation>();
  for (const e of data ?? []) {
    map.set(e.project_id, { puntaje: e.puntaje, comentario: e.comentario });
  }
  return map;
}
