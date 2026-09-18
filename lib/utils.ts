/**
 * Une clases condicionales en un solo string, descartando valores falsy.
 * Alternativa mínima a `clsx` para no sumar dependencias en el MVP.
 *
 *   cn("base", activo && "activo", undefined) -> "base activo"
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Normaliza una URL guardada como `sitio_web` para usarla en un `href`. El
 * formulario exige protocolo (`type="url"`), pero datos que entraron por
 * fuera del formulario (seeds, ediciones directas en la base) pueden traer
 * solo el dominio ("investigacion.unab.cl") — sin esto, el navegador lo trata
 * como una ruta relativa a la página actual y termina pegándole a una ruta
 * dinámica interna en vez de salir al sitio externo.
 */
export function externalUrl(valor: string): string {
  return /^https?:\/\//i.test(valor) ? valor : `https://${valor}`;
}

/**
 * Valida el formato de un UUID antes de usarlo en una consulta. Sin esto, un
 * id malformado en una URL pública (`/proyectos/6`, ruta escrita a mano o
 * bot) no llega a "no encontrado": Postgres tira `invalid input syntax for
 * type uuid` y la página revienta en vez de mostrar 404.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
