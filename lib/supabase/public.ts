import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Cliente público de Supabase: sin cookies ni sesión (rol anónimo). Para
 * lecturas de datos públicos —proyectos publicados— donde la RLS ya limita a lo
 * público (equivale a un visitante sin sesión).
 *
 * Por qué importa: al no leer cookies, las funciones que solo usan este cliente
 * son cacheables con `unstable_cache` (no fuerzan render dinámico por sesión) y
 * evitan una consulta a la base en cada request.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
