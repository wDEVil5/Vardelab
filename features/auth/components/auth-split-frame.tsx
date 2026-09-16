import type { ReactNode } from "react";

/**
 * Marco del auth a dos columnas.
 * Ambos lados oscuros (como el ejemplo de referencia): no hay costura
 * ink/surface que produzca una línea. El formulario va en una tarjeta clara.
 * Sin fade-in de página: un opacity:0 inicial dejaba ver el body blanco al
 * recargar y se sentía como un parpadeo.
 */
export function AuthSplitFrame({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen bg-ink">{children}</div>;
}
