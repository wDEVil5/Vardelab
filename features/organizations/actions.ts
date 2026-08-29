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
  });

  if (error) {
    console.error("[createOrganization]", error.message);
    return { error: "No se pudo crear la organización. Inténtalo de nuevo." };
  }

  revalidatePath("/mis-organizaciones");
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
    })
    .eq("id", id);

  if (error) {
    console.error("[updateOrganization]", error.message);
    return { error: "No se pudieron guardar los cambios. Inténtalo de nuevo." };
  }

  revalidatePath("/mis-organizaciones");
  redirect("/mis-organizaciones?editada=1");
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
  redirect("/mis-organizaciones?eliminada=1");
}
