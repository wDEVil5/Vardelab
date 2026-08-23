import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Cliente de Supabase para componentes del navegador ("use client").
 * Usa la anon key pública; el control de acceso real vive en las políticas RLS.
 * El genérico <Database> aporta el tipado de tablas, columnas y enums a las queries.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
