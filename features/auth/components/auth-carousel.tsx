"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Carrusel de información del panel de auth. Rota solo cada `intervalMs` y los
 * puntos permiten saltar a una diapositiva. No es decorativo: cada slide muestra
 * información relevante. Si cambia `resetKey` (p. ej. el rol elegido en el
 * registro), vuelve a la primera diapositiva para mostrar el contenido nuevo.
 */
export function AuthCarousel({
  slides,
  resetKey,
  intervalMs = 6000,
}: {
  slides: ReactNode[];
  resetKey?: string;
  intervalMs?: number;
}) {
  const count = slides.length;
  const [index, setIndex] = useState(0);

  // Volver a la primera diapositiva cuando cambia el contexto (rol). Patrón de
  // React: ajustar estado durante el render comparando con el valor previo.
  const [prevKey, setPrevKey] = useState(resetKey);
  if (resetKey !== prevKey) {
    setPrevKey(resetKey);
    setIndex(0);
  }

  const actual = Math.min(index, count - 1);

  // Auto-avance. Se reinicia al cambiar de diapositiva (también al seleccionar
  // un punto se posterga el siguiente salto).
  useEffect(() => {
    if (count <= 1) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => clearTimeout(t);
  }, [index, count, intervalMs]);

  return (
    <div className="flex flex-col gap-6">
      {/* La key incluye el contexto para reanimar el fundido al cambiar de rol. */}
      <div key={`${resetKey ?? ""}-${actual}`} className="animate-fade-in">
        {slides[actual]}
      </div>

      {count > 1 && (
        <div
          className="flex gap-1.5"
          role="tablist"
          aria-label="Información del piloto"
        >
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === actual}
              aria-label={`Diapositiva ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1 rounded-full transition-all",
                i === actual
                  ? "w-6 bg-electric"
                  : "w-3 bg-white/20 hover:bg-white/40",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
