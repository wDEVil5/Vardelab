import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Rate limiting propio (M83) para los Server Actions de auth, respaldado por
 * `check_rate_limit` en la base (atómico vía lock de fila, ver la migración).
 *
 * Si el RPC falla por algún motivo, el comportamiento por defecto es fallar
 * abierto (no bloquea el intento) para no convertir un problema de
 * infraestructura en una caída total del acceso — importante para
 * `login:ip`/`login:email`, que se evalúan en cada login de cada usuario: un
 * bug puntual en la función (no necesariamente la base entera caída)
 * bloquearía el ingreso a todos si fallara cerrado.
 *
 * `failClosed: true` invierte eso para scopes de bajo tráfico legítimo y alto
 * valor de abuso (signup, reset, reautenticación): ahí es preferible bloquear
 * de más ante un error de infraestructura que abrir una ventana sin límite de
 * intentos.
 */
export async function checkRateLimit(
  scope: string,
  identifier: string,
  maxIntentos: number,
  windowSeconds: number,
  { failClosed = false }: { failClosed?: boolean } = {},
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
    return !failClosed;
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
