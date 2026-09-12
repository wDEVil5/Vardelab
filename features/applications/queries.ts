import { createClient } from "@/lib/supabase/server";

/**
 * Capa de datos de postulaciones (lado del estudiante).
 */

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
 * Postulación activa que el usuario ya tiene en un proyecto, o `null`. "Activa"
 * es `enviada` o `aceptada`: un rechazo o un retiro previo no cuentan, así el
 * estudiante puede volver a intentar con otro rol del mismo proyecto.
 *
 * Es la fuente única de la regla "a lo sumo un rol por proyecto" en la interfaz:
 * si devuelve algo, el resto de roles del proyecto no debe ofrecer postular.
 */
export type MyProjectApplication = {
  roleId: string;
  roleNombre: string | null;
  status: string;
};

export async function getMyActiveApplicationInProject(
  projectId: string,
): Promise<MyProjectApplication | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Se filtra por el proyecto a través del rol (applications guarda el rol, no
  // el proyecto). `!inner` obliga a que el rol pertenezca a este proyecto.
  const { data, error } = await supabase
    .from("applications")
    .select("project_role_id, status, project_roles!inner ( project_id, nombre )")
    .eq("applicant_id", user.id)
    .eq("project_roles.project_id", projectId)
    .in("status", ["enviada", "aceptada"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[getMyActiveApplicationInProject]", error.message);
    return null;
  }
  if (!data) return null;

  // El embed many-to-one llega como objeto (o arreglo según el inferido); se
  // normaliza para leer el nombre del rol con seguridad.
  const rol = Array.isArray(data.project_roles)
    ? data.project_roles[0]
    : data.project_roles;

  return {
    roleId: data.project_role_id,
    roleNombre: rol?.nombre ?? null,
    status: data.status,
  };
}

export type SponsorPendingApplication = {
  id: string;
  status: string;
  created_at: string;
  applicant: ApplicantProfile | null;
  roleNombre: string | null;
  projectId: string;
  projectTitulo: string | null;
};

/**
 * Postulaciones `enviada` (pendientes de revisar) en cualquier proyecto propio
 * del patrocinador, de la más reciente a la más antigua. Es la bandeja de
 * entrada agregada que faltaba en el sidebar (S-04): antes solo se veían
 * postulaciones entrando a cada proyecto por separado. El filtro por
 * `role.project.created_by` hace de barrera de alcance (solo lo propio); la RLS
 * `applications_select_own_or_manager` es la que realmente lo garantiza.
 */
export async function getPendingApplicationsForSponsor(): Promise<
  SponsorPendingApplication[]
> {
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
      created_at,
      applicant_id,
      role:project_roles!inner (
        id,
        nombre,
        project:projects!inner ( id, titulo, created_by )
      )
    `,
    )
    .eq("status", "enviada")
    .eq("role.project.created_by", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getPendingApplicationsForSponsor]", error.message);
    throw error;
  }

  const rows = data ?? [];
  const applicantIds = Array.from(new Set(rows.map((r) => r.applicant_id)));

  const perfiles = new Map<string, ApplicantProfile>();
  if (applicantIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, nombre, carrera")
      .in("id", applicantIds);
    for (const p of profs ?? []) perfiles.set(p.id, p);
  }

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    created_at: r.created_at,
    applicant: perfiles.get(r.applicant_id) ?? null,
    roleNombre: r.role?.nombre ?? null,
    projectId: r.role?.project?.id ?? "",
    projectTitulo: r.role?.project?.titulo ?? null,
  }));
}

/**
 * Roles de un proyecto con las postulaciones de cada uno, para que el gestor las
 * revise. Verifica la propiedad con `created_by`; la RLS de M4/M12/M13 permite
 * al gestor leer las postulaciones y el perfil de cada postulante. `null` si el
 * proyecto no existe o no es del usuario → 404.
 *
 * También calcula, por postulación, cuántas de las habilidades exigidas por el
 * rol tiene el postulante en su perfil (`matchCount`/`matchTotal`) — es lo que
 * decide el badge "Recomendado" en la pantalla de selección de equipo (S-04) —
 * y trae el equipo ya formado (M29: `teams`/`team_members`).
 */
// Perfil resumido del postulante que ve el gestor.
export type ApplicantProfile = {
  id: string;
  nombre: string | null;
  carrera: string | null;
};

export type TeamMember = {
  userId: string;
  nombre: string | null;
  roleNombre: string | null;
};

export async function getProjectApplications(projectId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // 1) Proyecto + roles + postulaciones + habilidades exigidas por rol. No se
  // embebe el perfil del postulante aquí porque applications.applicant_id
  // referencia auth.users (no profiles), así que PostgREST no puede inferir
  // la relación; se resuelve con una segunda consulta.
  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      titulo,
      status,
      modalidad,
      duracion_semanas,
      roles:project_roles (
        id,
        nombre,
        cupos,
        skills:project_role_skills ( skill_id ),
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

  const roles = project.roles ?? [];

  // 2) Perfiles de los postulantes (la RLS de M13 permite verlos al gestor).
  const applicantIds = Array.from(
    new Set(roles.flatMap((r) => (r.applications ?? []).map((a) => a.applicant_id))),
  );

  const perfiles = new Map<string, ApplicantProfile>();
  const habilidadesPorPostulante = new Map<string, Set<string>>();
  if (applicantIds.length > 0) {
    const [{ data: profs }, { data: skills }] = await Promise.all([
      supabase.from("profiles").select("id, nombre, carrera").in("id", applicantIds),
      supabase
        .from("profile_skills")
        .select("profile_id, skill_id")
        .in("profile_id", applicantIds),
    ]);
    for (const p of profs ?? []) perfiles.set(p.id, p);
    for (const s of skills ?? []) {
      const set = habilidadesPorPostulante.get(s.profile_id) ?? new Set<string>();
      set.add(s.skill_id);
      habilidadesPorPostulante.set(s.profile_id, set);
    }
  }

  // 3) Equipo ya formado (si existe): integrantes con su nombre y el rol que cubren.
  const { data: team } = await supabase
    .from("teams")
    .select("id, team_members ( user_id, project_role_id )")
    .eq("project_id", projectId)
    .maybeSingle();

  const miembros = team?.team_members ?? [];
  const equipoIds = miembros.map((m) => m.user_id);
  const perfilesEquipo = new Map<string, string | null>();
  if (equipoIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, nombre")
      .in("id", equipoIds);
    for (const p of profs ?? []) perfilesEquipo.set(p.id, p.nombre);
  }
  const nombreRolPorId = new Map(roles.map((r) => [r.id, r.nombre]));

  const equipo: TeamMember[] = miembros.map((m) => ({
    userId: m.user_id,
    nombre: perfilesEquipo.get(m.user_id) ?? null,
    roleNombre: m.project_role_id ? (nombreRolPorId.get(m.project_role_id) ?? null) : null,
  }));

  // 4) Adjuntar perfil y match de habilidades a cada postulación.
  return {
    id: project.id,
    titulo: project.titulo,
    status: project.status,
    modalidad: project.modalidad,
    duracion_semanas: project.duracion_semanas,
    equipo,
    roles: roles.map((r) => {
      const requiredSkillIds = (r.skills ?? []).map((s) => s.skill_id);
      return {
        id: r.id,
        nombre: r.nombre,
        cupos: r.cupos,
        applications: (r.applications ?? []).map((a) => {
          const habilidades = habilidadesPorPostulante.get(a.applicant_id) ?? new Set<string>();
          const matchCount = requiredSkillIds.filter((id) => habilidades.has(id)).length;
          return {
            ...a,
            applicant: perfiles.get(a.applicant_id) ?? null,
            matchCount,
            matchTotal: requiredSkillIds.length,
          };
        }),
      };
    }),
  };
}

export type ProjectApplications = NonNullable<
  Awaited<ReturnType<typeof getProjectApplications>>
>;
