"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Acciones del portafolio (lado del estudiante). La RLS `portfolio_items_write_own`
 * (M6) exige que cada quien gestione solo sus evidencias (`profile_id = auth.uid()`).
 * El modelo es "enlace + contexto": la evidencia apunta a dónde vive el trabajo.
 */

export type PortfolioState = { error?: string };

export async function addPortfolioItem(
  _prevState: PortfolioState,
  formData: FormData,
): Promise<PortfolioState> {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  // Checkbox: si viene marcado, la evidencia nace pública.
  const publico = formData.get("publico") != null;

  if (!titulo) return { error: "La evidencia necesita un título." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { error } = await supabase.from("portfolio_items").insert({
    profile_id: user.id,
    titulo,
    descripcion: descripcion || null,
    url: url || null,
    // Se liga al proyecto solo si se eligió uno (queda como evidencia verificable).
    project_id: projectId || null,
    visibility: publico ? "publico" : "privado",
  });

  if (error) {
    console.error("[addPortfolioItem]", error.message);
    return { error: "No se pudo agregar la evidencia. Inténtalo de nuevo." };
  }

  revalidatePath("/perfil");
  return {};
}

/** Elimina una evidencia propia. La RLS restringe al dueño. */
export async function deletePortfolioItem(formData: FormData): Promise<void> {
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("portfolio_items")
    .delete()
    .eq("id", itemId)
    .eq("profile_id", user.id);

  if (error) console.error("[deletePortfolioItem]", error.message);

  revalidatePath("/perfil");
}

/**
 * Alterna la visibilidad de una evidencia (`privado` ↔ `publico`). El nuevo
 * estado llega en el formulario para no depender de una lectura previa.
 */
export async function togglePortfolioItemVisibility(
  formData: FormData,
): Promise<void> {
  const itemId = String(formData.get("itemId") ?? "");
  const nueva = String(formData.get("visibility") ?? "");
  if (!itemId || (nueva !== "publico" && nueva !== "privado")) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("portfolio_items")
    .update({ visibility: nueva })
    .eq("id", itemId)
    .eq("profile_id", user.id);

  if (error) console.error("[togglePortfolioItemVisibility]", error.message);

  revalidatePath("/perfil");
}
