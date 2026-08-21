import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para componentes del navegador ("use client").
 * Usa la anon key pública; el control de acceso real vive en las políticas RLS.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
