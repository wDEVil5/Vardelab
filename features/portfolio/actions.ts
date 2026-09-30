"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/features/auth/queries";

/**
 * Acciones del portafolio (lado del estudiante). La RLS `portfolio_items_write_own`
 * (M6, endurecida en M102) exige que cada quien gestione solo sus evidencias
 * (`profile_id = auth.uid()`), que el `project_id` ligado sea uno que de
 * verdad integró, y que publicarla ligada a un proyecto tenga el permiso de
 * divulgación del gestor (`projects.autoriza_divulgacion`). El modelo es
 * "enlace + contexto": la evidencia apunta a dónde vive el trabajo.
 */

export type PortfolioState = { error?: string; success?: boolean };
export type DeletePortfolioState = { error?: string; success?: boolean };

/**
 * Comprueba en servidor lo que la RLS de M102 exige, para devolver un mensaje
 * claro en vez de que la inserción falle con un error genérico de Postgres.
 * `null` = pasa la validación.
 */
async function validarProyectoLigado(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  publico: boolean,
): Promise<string | null> {
  const { data: participa } = await supabase.rpc("is_project_member", {
    _project_id: projectId,
  });
  if (!participa) {
    return "Solo puedes ligar la evidencia a un proyecto en el que participaste.";
  }

  if (publico) {
    const { data: proyecto } = await supabase
      .from("projects")
      .select("autoriza_divulgacion")
      .eq("id", projectId)
      .maybeSingle();
    if (!proyecto?.autoriza_divulgacion) {
      return "El proyecto encargado todavía no autorizó publicar su resultado. Puedes guardarla como privada mientras tanto.";
    }
  }

  return null;
}

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
  const user = await requireUser(supabase);

  if (projectId) {
    const error = await validarProyectoLigado(supabase, projectId, publico);
    if (error) return { error };
  }

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
  return { success: true };
}

/** Elimina una evidencia propia. La RLS restringe al dueño. */
export async function deletePortfolioItem(
  _prevState: DeletePortfolioState,
  formData: FormData,
): Promise<DeletePortfolioState> {
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return { error: "No se encontró la evidencia." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { error } = await supabase
    .from("portfolio_items")
    .delete()
    .eq("id", itemId)
    .eq("profile_id", user.id);

  if (error) {
    console.error("[deletePortfolioItem]", error.message);
    return { error: "No se pudo eliminar la evidencia. Inténtalo de nuevo." };
  }

  revalidatePath("/perfil");
  return { success: true };
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

  // Pasar a público una evidencia ligada a un proyecto exige que ESE proyecto
  // ya tenga el permiso de divulgación (M102) — se revalida acá porque el
  // permiso puede haber cambiado desde que se creó la evidencia.
  if (nueva === "publico") {
    const { data: item } = await supabase
      .from("portfolio_items")
      .select("project_id")
      .eq("id", itemId)
      .eq("profile_id", user.id)
      .maybeSingle();
    if (item?.project_id) {
      const { data: proyecto } = await supabase
        .from("projects")
        .select("autoriza_divulgacion")
        .eq("id", item.project_id)
        .maybeSingle();
      if (!proyecto?.autoriza_divulgacion) return;
    }
  }

  const { error } = await supabase
    .from("portfolio_items")
    .update({ visibility: nueva })
    .eq("id", itemId)
    .eq("profile_id", user.id);

  if (error) console.error("[togglePortfolioItemVisibility]", error.message);

  revalidatePath("/perfil");
}

export type ModeracionPortfolioState = { error?: string; ok?: boolean };

/**
 * Oculta o reactiva una ficha de portafolio por moderación (admin/moderador,
 * no el dueño) — REGLAS_NEGOCIO.md, "Confianza, privacidad y administración":
 * "posibilidad de ocultarla si divulga datos no autorizados". La autorización
 * real vive en `set_portfolio_item_moderacion` (M105, security definer, mismo
 * umbral moderador/admin que ya usa la RLS de `reports`); acá solo se valida
 * el motivo antes de gastar un viaje a la base, y se deja el rastro en
 * `audit_logs` (moderador ya puede insertar ahí desde M100).
 */
export async function setPortfolioItemModeracion(
  _prevState: ModeracionPortfolioState,
  formData: FormData,
): Promise<ModeracionPortfolioState> {
  const itemId = String(formData.get("itemId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  const oculto = formData.get("oculto") === "true";
  const motivo = String(formData.get("motivo") ?? "").trim();

  if (!itemId) return { error: "No se encontró la evidencia." };
  if (oculto && !motivo) return { error: "Deja un motivo para ocultarla." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { data: ok, error } = await supabase.rpc("set_portfolio_item_moderacion", {
    _item_id: itemId,
    _oculto: oculto,
    // Con oculto=false el motivo no se usa (la función lo descarta), pero el
    // parámetro SQL es `text` no nulable en el tipo generado — se manda "".
    _motivo: motivo,
  });

  if (error) {
    console.error("[setPortfolioItemModeracion]", error.message);
    return { error: "No se pudo aplicar la decisión. Inténtalo de nuevo." };
  }
  if (!ok) return { error: "No se encontró la evidencia." };

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    accion: oculto ? "portfolio_item_ocultado" : "portfolio_item_reactivado",
    entidad: "portfolio_items",
    entidad_id: itemId,
    metadata: oculto ? { motivo } : null,
  });

  if (profileId) revalidatePath(`/u/${profileId}`);
  return { ok: true };
}
