import type { ReactNode } from "react";

/**
 * Marco del auth a dos columnas: mitad oscura (símbolo + marca, ver
 * AuthBrandPanel) y mitad blanca (formulario, ver AuthFormPanel), de borde a
 * borde — mismo tratamiento que el modal (AuthModal), pero a pantalla
 * completa. `bg-ink` acá es solo el fondo de respaldo antes de que monten
 * los hijos. Sin fade-in de página: un opacity:0 inicial dejaba ver el body
 * blanco al recargar y se sentía como un parpadeo.
 */
export function AuthSplitFrame({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen bg-ink">{children}</div>;
}
