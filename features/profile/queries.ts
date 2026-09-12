import { createClient } from "@/lib/supabase/server";
import { perfilCompleto } from "@/features/dashboard/queries";

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
      "id, nombre, carrera, semestre, bio, intereses, disponibilidad, enlaces, visibility, avatar_url",
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

/**
 * Habilidades declaradas por el usuario actual, con el nombre de cada skill.
 * Vacío si no hay sesión. La RLS `profile_skills_select_public_or_own` (M2)
 * permite ver las propias.
 */
export async function getMyProfileSkills() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("profile_skills")
    .select("skill_id, nivel, skill:skills ( id, nombre )")
    .eq("profile_id", user.id);

  if (error) {
    console.error("[getMyProfileSkills]", error.message);
    return [];
  }

  return data;
}

export type MyProfileSkill = Awaited<
  ReturnType<typeof getMyProfileSkills>
>[number];

export type AvatarPreset = { id: string; url: string; etiqueta: string };

/**
 * Catálogo de avatares predefinidos, activos y en orden (M26). Es lectura
 * pública para cualquier usuario con sesión — no hay datos sensibles.
 */
export async function getAvatarPresets(): Promise<AvatarPreset[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("avatar_presets")
    .select("id, url, etiqueta")
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error) {
    console.error("[getAvatarPresets]", error.message);
    return [];
  }

  return data;
}

/**
 * % de completitud del perfil propio y qué campos faltan, para mostrarlo en
 * la propia página de edición (misma señal que ya se calcula para el KPI
 * de `/inicio`, reutilizada en vez de recalcularla con otro criterio).
 */
export async function getMyProfileCompletion() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return perfilCompleto(supabase, user.id);
}
