"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const cargo = String(formData.get("cargo") ?? "").trim();
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
      cargo: cargo || null,
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
  // También el perfil público: sin esto, después de guardar, navegar ahí con
  // un <Link> (sin recarga completa) podía mostrar la versión cacheada de
  // antes de los cambios — ni la tarjeta "Completa tu perfil" (que depende de
  // qué campos quedaron llenos) ni el resto del contenido se actualizaban.
  revalidatePath(`/u/${user.id}`);
  redirect("/perfil?guardado=1");
}

/**
 * Edición del perfil de un patrocinador: nombre, cargo, bio y enlaces — sin
 * carrera/semestre/intereses/disponibilidad, que son de estudiante y no le
 * aplican (ver `PerfilPatrocinador` en app/(app)/perfil/page.tsx). El nombre
 * va acá y no en un diálogo aparte: es el mismo formulario único que usa un
 * estudiante (`ProfileForm`/`updateProfile`), solo con menos campos.
 */
export async function updateSponsorProfile(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const cargo = String(formData.get("cargo") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const linkedin = String(formData.get("linkedin") ?? "").trim();
  const sitio = String(formData.get("sitio") ?? "").trim();

  if (!nombre) return { error: "Tu nombre no puede quedar vacío." };

  const enlaces: Record<string, string> = {};
  if (linkedin) enlaces.linkedin = linkedin;
  if (sitio) enlaces.sitio = sitio;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { error } = await supabase
    .from("profiles")
    .update({ nombre, cargo: cargo || null, bio: bio || null, enlaces })
    .eq("id", user.id);

  if (error) {
    console.error("[updateSponsorProfile]", error.message);
    return { error: "No se pudieron guardar los cambios. Inténtalo de nuevo." };
  }

  revalidatePath("/perfil");
  // Mismo motivo que en `updateProfile`: la tarjeta "Completa tu perfil" y
  // el resto de `/u/[id]` dependen de estos campos, sin esto podían quedar
  // con la versión cacheada de antes de guardar.
  revalidatePath(`/u/${user.id}`);
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
  // El toggle decide si /u/[id] existe siquiera para terceros (RLS): sin
  // revalidar esa ruta también, una vista cacheada de antes de cambiarlo
  // podía seguir mostrando el estado viejo hasta la siguiente carga fresca.
  revalidatePath(`/u/${user.id}`);
}

export type OnboardingState = { error?: string };

export type OnboardingData = {
  carrera: string;
  semestre: string;
  bio: string;
  intereses: string;
};

/**
 * Onboarding tras registrarse (M87): guarda lo que se haya llenado en los
 * pasos del wizard (todo opcional) y marca `onboarding_completado`. Se llama
 * directo desde el cliente (no desde un <form> nativo: el paso de
 * habilidades usa sus propios forms — ver `OnboardingWizard` — y anidar
 * <form> dentro de <form> es inválido), por eso recibe un objeto plano.
 *
 * A propósito SIN `revalidatePath`: el wizard muestra una animación de
 * cierre después de guardar, y necesita controlar el momento exacto en que
 * el layout deja de mostrar el modal (con su propio `router.refresh()`,
 * después de esa animación) — si esta acción revalidara la ruta ella misma,
 * el layout se refrescaría solo apenas termina el guardado, cortando la
 * animación a mitad de camino.
 */
export async function completeOnboarding(
  data: OnboardingData,
): Promise<OnboardingState> {
  const carrera = data.carrera.trim();
  const semestreRaw = data.semestre.trim();
  const bio = data.bio.trim();
  const intereses = data.intereses.trim();

  let semestre: number | null = null;
  if (semestreRaw) {
    const n = Number(semestreRaw);
    if (!Number.isInteger(n) || n < 1 || n > 14) {
      return { error: "El semestre debe ser un número entre 1 y 14." };
    }
    semestre = n;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { error } = await supabase
    .from("profiles")
    .update({
      carrera: carrera || null,
      semestre,
      bio: bio || null,
      intereses: intereses || null,
      onboarding_completado: true,
    })
    .eq("id", user.id);

  if (error) {
    console.error("[completeOnboarding]", error.message);
    return { error: "No se pudo guardar. Inténtalo de nuevo." };
  }

  return {};
}

export type SponsorOnboardingData = {
  cargo: string;
  bio: string;
  linkedin: string;
  sitio: string;
};

/**
 * Onboarding de patrocinador tras registrarse (M89): mismo mecanismo que
 * `completeOnboarding`, campos de patrocinador en vez de estudiante (sin
 * carrera/semestre/habilidades). A diferencia del primer intento, estos
 * datos SÍ tienen dónde mostrarse: la sección "Quién está detrás" de la
 * ficha pública de la organización, y `/u/[id]` si el perfil es público —
 * ver la revisión de M89 en BACKEND.md. Comparte el flag
 * `onboarding_completado` con la de estudiante (mutuamente excluyentes por
 * rol). Sin `revalidatePath` por el mismo motivo que las otras: el wizard
 * controla su propio cierre animado con `router.refresh()`.
 */
export async function completeSponsorOnboarding(
  data: SponsorOnboardingData,
): Promise<OnboardingState> {
  const cargo = data.cargo.trim();
  const bio = data.bio.trim();
  const linkedin = data.linkedin.trim();
  const sitio = data.sitio.trim();

  const enlaces: Record<string, string> = {};
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
      cargo: cargo || null,
      bio: bio || null,
      enlaces,
      onboarding_completado: true,
    })
    .eq("id", user.id);

  if (error) {
    console.error("[completeSponsorOnboarding]", error.message);
    return { error: "No se pudo guardar. Inténtalo de nuevo." };
  }

  return {};
}

/** Omitir el onboarding sin guardar nada: solo marca el flag. */
export async function skipOnboarding(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completado: true })
    .eq("id", user.id);

  if (error) console.error("[skipOnboarding]", error.message);

  revalidatePath("/inicio");
}

/**
 * Marca vista la pantalla informativa que se muestra al pasar a moderador
 * (M88). Sin `revalidatePath`, mismo motivo que `completeOnboarding`: el
 * cliente muestra su propia animación de cierre y recién ahí pide el
 * refresh, en vez de que una revalidación automática la corte a la mitad.
 */
export async function completeModeradorIntro(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { error } = await supabase
    .from("profiles")
    .update({ moderador_intro_completado: true })
    .eq("id", user.id);

  if (error) {
    console.error("[completeModeradorIntro]", error.message);
    return { error: "No se pudo continuar. Inténtalo de nuevo." };
  }

  return {};
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

/** Mutación compartida por `addProfileSkill` (perfil) y `addOnboardingSkill`
 * (wizard): separada para que cada una decida aparte qué revalidar, sin
 * duplicar la validación ni el insert. */
async function insertProfileSkill(skillId: string, nivel: string): Promise<AddSkillState> {
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
    console.error("[insertProfileSkill]", error.message);
    return { error: "No se pudo agregar la habilidad." };
  }

  return {};
}

/**
 * Agrega una habilidad al perfil propio, con su nivel. La RLS
 * `profile_skills_write_own` (M2) exige que sea el perfil del usuario.
 */
export async function addProfileSkill(
  _prevState: AddSkillState,
  formData: FormData,
): Promise<AddSkillState> {
  const result = await insertProfileSkill(
    String(formData.get("skillId") ?? ""),
    String(formData.get("nivel") ?? ""),
  );
  if (!result.error) revalidatePath("/perfil");
  return result;
}

/**
 * Misma mutación, para el paso de habilidades del onboarding (M87). Sin
 * `revalidatePath`: ese wizard vive sobre /inicio, y revalidar cualquier
 * ruta durante una Server Action hace que Next refresque la ruta actual
 * igual — remontando el wizard entero y perdiendo el paso en el que estaba
 * (bug real: se veía como si el modal se cerrara solo al agregar una
 * habilidad).
 */
export async function addOnboardingSkill(skillId: string, nivel: string): Promise<AddSkillState> {
  return insertProfileSkill(skillId, nivel);
}

export type DeleteProfileSkillState = { error?: string };

/** Mutación compartida por `deleteProfileSkill` y `removeOnboardingSkill`. */
async function removeProfileSkill(skillId: string): Promise<DeleteProfileSkillState> {
  if (!skillId) return { error: "Falta la habilidad." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { error } = await supabase
    .from("profile_skills")
    .delete()
    .eq("profile_id", user.id)
    .eq("skill_id", skillId);

  if (error) {
    console.error("[removeProfileSkill]", error.message);
    return { error: "No se pudo quitar la habilidad. Inténtalo de nuevo." };
  }

  return {};
}

/** Quita una habilidad del perfil propio. */
export async function deleteProfileSkill(
  _prevState: DeleteProfileSkillState,
  formData: FormData,
): Promise<DeleteProfileSkillState> {
  const result = await removeProfileSkill(String(formData.get("skillId") ?? ""));
  if (!result.error) revalidatePath("/perfil");
  return result;
}

/** Misma mutación, para el paso de habilidades del onboarding (M87) — ver el comentario en `addOnboardingSkill`. */
export async function removeOnboardingSkill(skillId: string): Promise<DeleteProfileSkillState> {
  return removeProfileSkill(skillId);
}

export type DeleteAccountState = { error?: string };

/**
 * Elimina la cuenta propia (auditoría de punta a punta, GDPR §10.1). Bloqueado
 * si el usuario es dueño de alguna organización: `organizations.owner_id` es
 * `on delete cascade`, así que borrar la cuenta se llevaría puesta la
 * organización entera y, en cascada, los proyectos y evaluaciones de
 * estudiantes que no pidieron borrar nada. Para ese caso se pide resolver la
 * organización primero (transferirla o cerrarla) con soporte — no vale la
 * pena construir un flujo de transferencia de dueño para un piloto chico.
 */
export async function deleteAccount(): Promise<DeleteAccountState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { count, error: countError } = await supabase
    .from("organizations")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);
  // Fail-closed: si no se pudo confirmar que NO es dueño de ninguna
  // organización, no se procede a borrar la cuenta.
  if (countError) {
    console.error("[deleteAccount]", countError.message);
    return { error: "No se pudo verificar tu cuenta. Inténtalo de nuevo." };
  }
  if (count && count > 0) {
    return {
      error:
        "Eres dueño de una organización. Contacta a soporte para transferirla o cerrarla antes de eliminar tu cuenta.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[deleteAccount]", error.message);
    return { error: "No se pudo eliminar la cuenta. Inténtalo de nuevo." };
  }

  await supabase.auth.signOut();
  redirect("/?cuenta-eliminada=1");
}
