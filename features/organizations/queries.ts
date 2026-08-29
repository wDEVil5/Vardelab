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
