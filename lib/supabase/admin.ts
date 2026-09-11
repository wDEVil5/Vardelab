import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Cliente con la `service_role` key: salta toda la RLS y accede al esquema
 * `auth` (listar usuarios, banear/reactivar cuentas). Server-only — nunca
 * importar desde un componente cliente ni exponer la clave al navegador.
 *
 * Cada función que lo usa debe volver a comprobar `esAdmin` (con
 * `getCurrentUser()`) antes de llamarlo: este cliente no tiene guarda propia,
 * confía en quien lo invoca.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
