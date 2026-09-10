import { createClient } from "@/lib/supabase/server";

/**
 * Capa de datos de leads (lado del staff). La RLS `leads_select_staff` (M17)
 * limita la lectura a moderador/admin; si el usuario no tiene ese rol, Supabase
 * devuelve simplemente cero filas (no un error).
 */

/**
 * Leads en estado `nuevo`, del más reciente al más antiguo. Es la bandeja de
 * entrada: lo que todavía nadie gestionó.
 */
export async function getPendingLeads() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("id, tipo, nombre, email, organizacion, mensaje, created_at")
    .eq("estado", "nuevo")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getPendingLeads]", error.message);
    return [];
  }

  return data;
}

export type PendingLead = Awaited<ReturnType<typeof getPendingLeads>>[number];
