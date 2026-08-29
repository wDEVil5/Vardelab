import { createClient } from "@/lib/supabase/server";

/**
 * Organizaciones de las que el usuario actual es dueño. Vacío si no hay sesión.
 * Necesario para el flujo del patrocinador: un proyecto se crea siempre bajo una
 * organización propia (lo exige la RLS `projects_insert_own_org` de M3).
 */
export async function getMyOrganizations() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("organizations")
    .select("id, nombre, tipo, verificacion")
    .eq("owner_id", user.id)
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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("organizations")
    .select("id, nombre, tipo, descripcion, sitio_web, contacto, verificacion")
    .eq("id", id)
    .eq("owner_id", user.id)
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
