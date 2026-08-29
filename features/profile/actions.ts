"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Edición del perfil propio. La RLS `profiles_update_own` (M1) exige
 * `id = auth.uid()`; aquí se validan los datos y se arman los enlaces (jsonb).
 */

export type ProfileState = { error?: string };

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const carrera = String(formData.get("carrera") ?? "").trim();
  const semestreRaw = String(formData.get("semestre") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const intereses = String(formData.get("intereses") ?? "").trim();
  const disponibilidad = String(formData.get("disponibilidad") ?? "").trim();
  const github = String(formData.get("github") ?? "").trim();
  const linkedin = String(formData.get("linkedin") ?? "").trim();
  const sitio = String(formData.get("sitio") ?? "").trim();

  if (!nombre) return { error: "Tu nombre no puede quedar vacío." };

  // Semestre: opcional; si viene, un entero razonable (1–14).
  let semestre: number | null = null;
  if (semestreRaw) {
    const n = Number(semestreRaw);
    if (!Number.isInteger(n) || n < 1 || n > 14) {
      return { error: "El semestre debe ser un número entre 1 y 14." };
    }
    semestre = n;
  }

  // Enlaces: solo se guardan los que se completaron.
  const enlaces: Record<string, string> = {};
  if (github) enlaces.github = github;
  if (linkedin) enlaces.linkedin = linkedin;
  if (sitio) enlaces.sitio = sitio;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { error } = await supabase
    .from("profiles")
    .update({
      nombre,
      carrera: carrera || null,
      semestre,
      bio: bio || null,
      intereses: intereses || null,
      disponibilidad: disponibilidad || null,
      enlaces,
    })
    .eq("id", user.id);

  if (error) {
    console.error("[updateProfile]", error.message);
    return { error: "No se pudieron guardar los cambios. Inténtalo de nuevo." };
  }

  revalidatePath("/perfil");
  redirect("/perfil?guardado=1");
}

export type AddSkillState = { error?: string };

const NIVELES = ["basico", "intermedio", "avanzado"] as const;

/**
 * Agrega una habilidad al perfil propio, con su nivel. La RLS
 * `profile_skills_write_own` (M2) exige que sea el perfil del usuario.
 */
export async function addProfileSkill(
  _prevState: AddSkillState,
  formData: FormData,
): Promise<AddSkillState> {
  const skillId = String(formData.get("skillId") ?? "");
  const nivel = String(formData.get("nivel") ?? "");

  if (!skillId) return { error: "Selecciona una habilidad." };
  if (!NIVELES.includes(nivel as (typeof NIVELES)[number])) {
    return { error: "Selecciona un nivel válido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { error } = await supabase.from("profile_skills").insert({
    profile_id: user.id,
    skill_id: skillId,
    nivel: nivel as (typeof NIVELES)[number],
  });

  if (error) {
    if (error.code === "23505") return { error: "Esa habilidad ya está en tu perfil." };
    console.error("[addProfileSkill]", error.message);
    return { error: "No se pudo agregar la habilidad." };
  }

  revalidatePath("/perfil");
  return {};
}

/** Quita una habilidad del perfil propio. */
export async function deleteProfileSkill(formData: FormData): Promise<void> {
  const skillId = String(formData.get("skillId") ?? "");
  if (!skillId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("profile_skills")
    .delete()
    .eq("profile_id", user.id)
    .eq("skill_id", skillId);

  if (error) console.error("[deleteProfileSkill]", error.message);

  revalidatePath("/perfil");
}
