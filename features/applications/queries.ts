import { createClient } from "@/lib/supabase/server";

/**
 * Capa de datos de postulaciones (lado del estudiante).
 */

/**
 * IDs de los roles a los que el usuario actual ya postuló, dentro de un
 * proyecto. Devuelve un Set para consultar en O(1) al pintar los roles.
 * Vacío si no hay sesión. La RLS ya limita a las postulaciones propias.
 */
export async function getMyApplicationRoleIds(
  projectRoleIds: string[],
): Promise<Set<string>> {
  if (projectRoleIds.length === 0) return new Set();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Set();

  const { data, error } = await supabase
    .from("applications")
    .select("project_role_id")
    .eq("applicant_id", user.id)
    .in("project_role_id", projectRoleIds);

  if (error) {
    console.error("[getMyApplicationRoleIds]", error.message);
    return new Set();
  }

  return new Set(data.map((a) => a.project_role_id));
}

/**
 * Postulaciones del usuario actual, de la más reciente a la más antigua, con el
 * rol, el proyecto y la organización. Vacío si no hay sesión. La RLS
 * (`applications_select_own_or_manager`) ya limita a las postulaciones propias.
 */
export async function getMyApplications() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      mensaje,
      created_at,
      role:project_roles!inner (
        id,
        nombre,
        project:projects!inner (
          id,
          titulo,
          organization:organizations ( nombre )
        )
      )
    `,
    )
    .eq("applicant_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getMyApplications]", error.message);
    throw error;
  }

  return data;
}

export type MyApplication = Awaited<
  ReturnType<typeof getMyApplications>
>[number];

/**
 * Roles de un proyecto con las postulaciones de cada uno, para que el gestor las
 * revise. Verifica la propiedad con `created_by`; la RLS de M4/M12/M13 permite
 * al gestor leer las postulaciones y el perfil de cada postulante. `null` si el
 * proyecto no existe o no es del usuario → 404.
 */
// Perfil resumido del postulante que ve el gestor.
export type ApplicantProfile = {
  id: string;
  nombre: string | null;
  carrera: string | null;
};

export async function getProjectApplications(projectId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // 1) Proyecto + roles + postulaciones. No se embebe el perfil aquí porque
  // applications.applicant_id referencia auth.users (no profiles), así que
  // PostgREST no puede inferir la relación; se resuelve con una segunda consulta.
  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      titulo,
      roles:project_roles (
        id,
        nombre,
        cupos,
        applications (
          id,
          status,
          mensaje,
          evidencia,
          disponibilidad,
          created_at,
          applicant_id
        )
      )
    `,
    )
    .eq("id", projectId)
    .eq("created_by", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getProjectApplications]", error.message);
    throw error;
  }
  if (!project) return null;

  // 2) Perfiles de los postulantes (la RLS de M13 permite verlos al gestor).
  const applicantIds = Array.from(
    new Set(
      (project.roles ?? []).flatMap((r) =>
        (r.applications ?? []).map((a) => a.applicant_id),
      ),
    ),
  );

  const perfiles = new Map<string, ApplicantProfile>();
  if (applicantIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, nombre, carrera")
      .in("id", applicantIds);
    for (const p of profs ?? []) perfiles.set(p.id, p);
  }

  // 3) Adjuntar el perfil a cada postulación.
  return {
    id: project.id,
    titulo: project.titulo,
    roles: (project.roles ?? []).map((r) => ({
      id: r.id,
      nombre: r.nombre,
      cupos: r.cupos,
      applications: (r.applications ?? []).map((a) => ({
        ...a,
        applicant: perfiles.get(a.applicant_id) ?? null,
      })),
    })),
  };
}

export type ProjectApplications = NonNullable<
  Awaited<ReturnType<typeof getProjectApplications>>
>;
