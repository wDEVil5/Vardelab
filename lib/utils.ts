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
