import { createClient } from "@/lib/supabase/server";

/**
 * Perfil del usuario actual con sus campos editables. `null` si no hay sesión.
 * La RLS `profiles_select_public_or_own` (M1) permite leer el propio.
 */
export async function getMyProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, nombre, carrera, semestre, bio, intereses, disponibilidad, enlaces",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getMyProfile]", error.message);
    throw error;
  }

  return data;
}

export type MyProfile = NonNullable<Awaited<ReturnType<typeof getMyProfile>>>;

// Enlaces del perfil (se guardan como jsonb en la columna `enlaces`).
export type ProfileLinks = {
  github?: string;
  linkedin?: string;
  sitio?: string;
};
