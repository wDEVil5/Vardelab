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
