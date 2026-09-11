import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Selector con flecha propia. Un `<select>` a secas se apoya en la flecha
 * nativa del sistema operativo/navegador: cambia de tamaño y posición entre
 * ellos y, sin un ancho fijo, el control "salta" de tamaño según el texto de
 * la opción elegida. Acá se oculta la flecha nativa (`appearance-none`), se
 * dibuja una propia y el ancho lo fija quien lo usa (`className` va en el
 * contenedor, no en el `<select>`, así nunca compite con `uiSize`).
 *
 * La prop se llama `uiSize` (no `size`) porque `size` ya es un atributo nativo
 * de `<select>` (numérico, cuántas opciones mostrar a la vez) — reusar el
 * nombre chocaría con `ComponentProps<"select">`.
 */

const sizeClasses = {
  sm: "h-8 pl-2.5 pr-7 text-xs",
  md: "h-11 pl-3 pr-9 text-sm",
} as const;

const chevronClasses = {
  sm: "right-2 size-3.5",
  md: "right-3 size-4",
} as const;

export type SelectSize = keyof typeof sizeClasses;

type SelectProps = ComponentProps<"select"> & {
  uiSize?: SelectSize;
  /** Clases del contenedor (ancho, márgenes) — nunca del `<select>` en sí. */
  className?: string;
};

export function Select({ uiSize = "md", className, ...props }: SelectProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        className={cn(
          "w-full appearance-none rounded-lg border border-border bg-white text-ink",
          "focus:border-electric focus:outline-none disabled:opacity-50",
          sizeClasses[uiSize],
        )}
        {...props}
      />
      <svg
        viewBox="0 0 24 24"
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted",
          chevronClasses[uiSize],
        )}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}
