"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Acciones de organizaciones (lado del patrocinador).
 *
 * `createOrganization` crea una organización propiedad del usuario. La RLS
 * `organizations_insert_own` (M3) exige `owner_id = auth.uid()`; la organización
 * nace `sin_verificar` (default de la tabla) — la verificación la hará el
 * moderador/admin en una etapa futura.
 */

export type CreateOrgState = { error?: string };

// Tipos de organización (enum org_type de M0).
const TIPOS = [
  "academica",
  "social",
  "emprendimiento",
  "empresa",
  "interna",
] as const;

export async function createOrganization(
  _prevState: CreateOrgState,
  formData: FormData,
): Promise<CreateOrgState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "");
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const sitioWeb = String(formData.get("sitio_web") ?? "").trim();
  const contacto = String(formData.get("contacto") ?? "").trim();
  const contactoEmail = String(formData.get("contacto_email") ?? "").trim();

  if (!nombre) return { error: "La organización necesita un nombre." };
  if (!TIPOS.includes(tipo as (typeof TIPOS)[number])) {
    return { error: "Selecciona un tipo de organización válido." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { error } = await supabase.from("organizations").insert({
    owner_id: user.id,
    nombre,
    tipo: tipo as (typeof TIPOS)[number],
    descripcion: descripcion || null,
    sitio_web: sitioWeb || null,
    contacto: contacto || null,
    contacto_email: contactoEmail || null,
  });

  if (error) {
    console.error("[createOrganization]", error.message);
    return { error: "No se pudo crear la organización. Inténtalo de nuevo." };
  }

  revalidatePath("/mis-organizaciones");
  revalidatePath("/organizaciones");
  redirect("/mis-organizaciones?creada=1");
}

export type EditOrgState = { error?: string };

/**
 * Edita una organización propia. No toca `verificacion` (eso es del moderador).
 * La RLS `organizations_update_own` (M3) exige `owner_id = auth.uid()`, y aquí
 * se filtra el update por `id` para acotarlo a la organización indicada.
 */
export async function updateOrganization(
  _prevState: EditOrgState,
  formData: FormData,
): Promise<EditOrgState> {
  const id = String(formData.get("orgId") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "");
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const sitioWeb = String(formData.get("sitio_web") ?? "").trim();
  const contacto = String(formData.get("contacto") ?? "").trim();
  const contactoEmail = String(formData.get("contacto_email") ?? "").trim();

  if (!id) return { error: "Falta la organización." };
  if (!nombre) return { error: "La organización necesita un nombre." };
  if (!TIPOS.includes(tipo as (typeof TIPOS)[number])) {
    return { error: "Selecciona un tipo de organización válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      nombre,
      tipo: tipo as (typeof TIPOS)[number],
      descripcion: descripcion || null,
      sitio_web: sitioWeb || null,
      contacto: contacto || null,
      contacto_email: contactoEmail || null,
    })
    .eq("id", id);

  if (error) {
    console.error("[updateOrganization]", error.message);
    return { error: "No se pudieron guardar los cambios. Inténtalo de nuevo." };
  }

  revalidatePath("/mis-organizaciones");
  revalidatePath("/organizaciones");
  revalidatePath(`/mis-organizaciones/${id}/editar`);
  redirect(`/mis-organizaciones/${id}/editar?guardado=1`);
}

export type DeleteOrgState = { error?: string };

/**
 * Elimina una organización propia. Regla de seguridad (por la cascada: borrar
 * una organización arrastra TODOS sus proyectos y, con ellos, roles,
 * postulaciones, equipos, hitos y evaluaciones): solo se permite si la
 * organización no tiene proyectos. La RLS `organizations_delete_own` (M3) ya
 * restringe al dueño; esta guarda agrega la protección de negocio.
 */
export async function deleteOrganization(
  _prevState: DeleteOrgState,
  formData: FormData,
): Promise<DeleteOrgState> {
  const id = String(formData.get("orgId") ?? "");
  if (!id) return { error: "Falta la organización." };

  const supabase = await createClient();

  // No debe tener proyectos.
  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("org_id", id);

  if (count && count > 0) {
    return {
      error:
        "No puedes eliminar una organización con proyectos. Elimina o mueve sus proyectos primero.",
    };
  }

  const { error } = await supabase.from("organizations").delete().eq("id", id);
  if (error) {
    console.error("[deleteOrganization]", error.message);
    return { error: "No se pudo eliminar la organización. Inténtalo de nuevo." };
  }

  revalidatePath("/mis-organizaciones");
  revalidatePath("/organizaciones");
  redirect("/mis-organizaciones?eliminada=1");
}

export type OrgLogoState = { error?: string };

const LOGO_TIPOS_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"];
const LOGO_TAMANO_MAXIMO = 2 * 1024 * 1024; // 2 MB, igual que el bucket (M35).

/**
 * Sube el logo de una organización propia (S-01). Mismo patrón que
 * `uploadAvatar` (M25): un objeto por organización en el bucket `org-logos`,
 * nombrado con su propio id — la política de Storage (`org_logos_insert_own`,
 * M35) es la que realmente impide subir el logo de una organización ajena.
 */
export async function uploadOrgLogo(
  _prevState: OrgLogoState,
  formData: FormData,
): Promise<OrgLogoState> {
  const orgId = String(formData.get("orgId") ?? "");
  const file = formData.get("logo");

  if (!orgId) return { error: "Falta la organización." };
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona una imagen." };
  }
  if (!LOGO_TIPOS_PERMITIDOS.includes(file.type)) {
    return { error: "Formato no admitido. Usa PNG, JPG o WEBP." };
  }
  if (file.size > LOGO_TAMANO_MAXIMO) {
    return { error: "La imagen no puede pesar más de 2 MB." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { error: uploadError } = await supabase.storage
    .from("org-logos")
    .upload(orgId, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    console.error("[uploadOrgLogo]", uploadError.message);
    return { error: "No se pudo subir el logo. Inténtalo de nuevo." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("org-logos").getPublicUrl(orgId);

  const { error } = await supabase
    .from("organizations")
    .update({ logo_url: `${publicUrl}?v=${Date.now()}` })
    .eq("id", orgId);

  if (error) {
    console.error("[uploadOrgLogo]", error.message);
    return { error: "No se pudo guardar el logo." };
  }

  revalidatePath(`/mis-organizaciones/${orgId}/editar`);
  revalidatePath("/mis-organizaciones");
  revalidatePath("/organizaciones");
  return {};
}
