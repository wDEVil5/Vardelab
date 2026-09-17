import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Rate limiting propio (M83) para los Server Actions de auth, respaldado por
 * `check_rate_limit` en la base (atómico vía lock de fila, ver la migración).
 * Si el RPC falla por algún motivo, se falla abierto (no bloquea el login)
 * para no convertir un problema de infraestructura en una caída del acceso.
 */
export async function checkRateLimit(
  scope: string,
  identifier: string,
  maxIntentos: number,
  windowSeconds: number,
): Promise<boolean> {
  const supabase = await createClient();
  const key = `${scope}:${identifier.toLowerCase()}`;
  const { data, error } = await supabase.rpc("check_rate_limit", {
    _key: key,
    _max_intentos: maxIntentos,
    _window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[checkRateLimit]", error.message);
    return true;
  }
  return data === true;
}

// `x-forwarded-for` puede traer una lista "cliente, proxy1, proxy2" — el
// primer valor es el más cercano al cliente real detrás de Vercel/el proxy.
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

export const RATE_LIMIT_MESSAGE = "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
