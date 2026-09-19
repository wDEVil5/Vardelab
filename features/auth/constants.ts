// Destino tras autenticarse. Provisional hasta que exista el panel del rol.
// En su propio archivo (no en actions.ts) porque un módulo "use server" solo
// puede exportar funciones async — una constante ahí rompe el build entero.
export const POST_AUTH_REDIRECT = "/inicio";

/**
 * Sanea el `?next=` que las páginas protegidas agregan al mandar a
 * `/ingresar` (p. ej. `/ingresar?next=/mis-proyectos/nuevo`), para volver ahí
 * después de loguearse en vez de siempre a `POST_AUTH_REDIRECT`. Exige que
 * sea una ruta local (`/algo`) y rechaza `//host` o `/\host` — ambos los
 * interpreta el navegador como protocol-relative y saltarían a otro sitio
 * (open redirect).
 */
export function safeNextPath(next: string | undefined): string {
  if (!next) return POST_AUTH_REDIRECT;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return POST_AUTH_REDIRECT;
  }
  return next;
}
