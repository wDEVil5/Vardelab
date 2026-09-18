import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { isUuid } from "@/lib/utils";

/**
 * Ids de las organizaciones que el usuario actual puede gestionar: de las que
 * es dueño, o donde es miembro activo (M38) — mismos permisos que el dueño.
 * Base para todo lo demás en este archivo y en projects/applications/
 * milestones: reemplaza al viejo criterio de "soy el dueño" por "pertenezco a
 * la organización".
 */
export async function getMyOrgIds(): Promise<string[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: propias }, { data: miembro }] = await Promise.all([
    supabase.from("organizations").select("id").eq("owner_id", user.id),
    supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", user.id)
      .eq("status", "activo"),
  ]);

  return Array.from(
    new Set([
      ...(propias ?? []).map((o) => o.id),
      ...(miembro ?? []).map((m) => m.org_id),
    ]),
  );
}

/**
 * Organizaciones que el usuario actual puede gestionar (dueño o miembro).
 * Vacío si no hay sesión. Necesario para el flujo del patrocinador: un
 * proyecto se crea siempre bajo una organización propia (lo exige la RLS
 * `projects_insert_own_org` de M3).
 */
export async function getMyOrganizations() {
  const orgIds = await getMyOrgIds();
  if (orgIds.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, nombre, tipo, logo_url, verificacion")
    .in("id", orgIds)
    .order("nombre");

  if (error) {
    console.error("[getMyOrganizations]", error.message);
    throw error;
  }

  return data;
}

export type MyOrganization = Awaited<
  ReturnType<typeof getMyOrganizations>
>[number];

/**
 * Una organización propia por id, con los campos editables. Devuelve `null` si
 * no existe o no es del usuario (se filtra por `owner_id`) → la página muestra
 * 404. Base para el formulario de edición.
 */
export async function getMyOrganization(id: string) {
  if (!isUuid(id)) return null;
  const orgIds = await getMyOrgIds();
  if (!orgIds.includes(id)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select(
      "id, nombre, tipo, descripcion, sitio_web, contacto, contacto_email, logo_url, verificacion",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getMyOrganization]", error.message);
    throw error;
  }

  return data;
}

export type EditableOrganization = NonNullable<
  Awaited<ReturnType<typeof getMyOrganization>>
>;

/**
 * Perfil público de una organización (análogo a `getPublicProfile` del
 * estudiante). A diferencia de `profiles`, `organizations` no tiene una
 * columna de visibilidad: la RLS `organizations_select_all` ya permite leerla
 * a cualquier visitante, así que basta con buscarla por id. `null` si el id
 * no tiene forma de UUID o no existe → la página hace 404.
 */
export async function getPublicOrganization(id: string) {
  if (!isUuid(id)) return null;
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("organizations")
    .select(
      "id, nombre, tipo, descripcion, sitio_web, contacto, contacto_email, logo_url, verificacion, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getPublicOrganization]", error.message);
    throw error;
  }

  return data;
}

export type PublicOrganization = NonNullable<
  Awaited<ReturnType<typeof getPublicOrganization>>
>;

/**
 * Miembros e invitaciones pendientes de una organización propia (M37). `perfil`
 * va `null` mientras la invitación está pendiente (nadie con ese `user_id`
 * todavía). `roles` (M74) deja ver, para un miembro ya activo, qué rol tiene
 * hoy en la plataforma (p. ej. si ya es 'estudiante') — vía una función acotada
 * que solo expone roles de gente que ya es miembro activo de una organización
 * que quien consulta ya gestiona, nunca un lookup libre por correo.
 */
export async function getOrganizationMembers(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_members")
    .select("id, invited_email, status, user_id, created_at")
    .eq("org_id", orgId)
    .order("created_at");

  if (error) {
    console.error("[getOrganizationMembers]", error.message);
    throw error;
  }

  const userIds = (data ?? [])
    .map((m) => m.user_id)
    .filter((id): id is string => Boolean(id));

  const perfiles = new Map<string, string | null>();
  const roles = new Map<string, string[]>();
  if (userIds.length > 0) {
    const [{ data: profs }, { data: rolesData }] = await Promise.all([
      supabase.from("profiles").select("id, nombre").in("id", userIds),
      supabase.rpc("organization_member_roles", { _org_id: orgId }),
    ]);
    for (const p of profs ?? []) perfiles.set(p.id, p.nombre);
    for (const r of rolesData ?? []) {
      const lista = roles.get(r.user_id) ?? [];
      lista.push(r.role);
      roles.set(r.user_id, lista);
    }
  }

  return (data ?? []).map((m) => ({
    ...m,
    nombre: m.user_id ? (perfiles.get(m.user_id) ?? null) : null,
    roles: m.user_id ? (roles.get(m.user_id) ?? []) : [],
  }));
}

export type OrganizationMember = Awaited<
  ReturnType<typeof getOrganizationMembers>
>[number];
