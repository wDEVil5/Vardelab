/**
 * Une clases condicionales en un solo string, descartando valores falsy.
 * Alternativa mínima a `clsx` para no sumar dependencias en el MVP.
 *
 *   cn("base", activo && "activo", undefined) -> "base activo"
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
