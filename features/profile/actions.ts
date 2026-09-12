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

/**
 * Hace el perfil público o privado (`profiles.visibility`). Es lo que habilita
 * la página pública `/u/[id]`: mientras es `privado`, la RLS no deja verlo a
 * terceros. El nuevo estado llega en el formulario. RLS `profiles_update_own`.
 */
export async function setProfileVisibility(formData: FormData): Promise<void> {
  const nueva = String(formData.get("visibility") ?? "");
  if (nueva !== "publico" && nueva !== "privado") return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("profiles")
    .update({ visibility: nueva })
    .eq("id", user.id);

  if (error) console.error("[setProfileVisibility]", error.message);

  revalidatePath("/perfil");
}

export type AvatarState = { error?: string };

const AVATAR_TIPOS_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"];
const AVATAR_TAMANO_MAXIMO = 2 * 1024 * 1024; // 2 MB, igual que el límite del bucket.

/**
 * Sube (o reemplaza) la foto de perfil. Un archivo por usuario, nombrado con
 * su propio id (`avatars_insert_own`/`avatars_update_own`, M25); `upsert`
 * evita tener que borrar el anterior. El nombre incluye la hora de subida
 * como query param para invalidar el caché del navegador ante un reemplazo.
 */
export async function uploadAvatar(
  _prevState: AvatarState,
  formData: FormData,
): Promise<AvatarState> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona una imagen." };
  }
  if (!AVATAR_TIPOS_PERMITIDOS.includes(file.type)) {
    return { error: "Formato no admitido. Usa PNG, JPG o WEBP." };
  }
  if (file.size > AVATAR_TAMANO_MAXIMO) {
    return { error: "La imagen no puede pesar más de 2 MB." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(user.id, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    console.error("[uploadAvatar]", uploadError.message);
    return { error: "No se pudo subir la imagen. Inténtalo de nuevo." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(user.id);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: `${publicUrl}?v=${Date.now()}` })
    .eq("id", user.id);

  if (error) {
    console.error("[uploadAvatar]", error.message);
    return { error: "No se pudo guardar la foto en tu perfil." };
  }

  revalidatePath("/perfil");
  return {};
}

/**
 * Elige un avatar del catálogo (M26) en vez de subir una foto propia. El
 * cliente solo manda el id; la URL real se busca en el servidor para no
 * confiar en una URL que llegue del formulario.
 */
export async function selectAvatarPreset(
  _prevState: AvatarState,
  formData: FormData,
): Promise<AvatarState> {
  const presetId = String(formData.get("presetId") ?? "");
  if (!presetId) return { error: "Selecciona un avatar." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { data: preset, error: presetError } = await supabase
    .from("avatar_presets")
    .select("url")
    .eq("id", presetId)
    .eq("activo", true)
    .maybeSingle();

  if (presetError || !preset) {
    return { error: "Ese avatar ya no está disponible." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: preset.url })
    .eq("id", user.id);

  if (error) {
    console.error("[selectAvatarPreset]", error.message);
    return { error: "No se pudo actualizar tu foto." };
  }

  revalidatePath("/perfil");
  return {};
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
