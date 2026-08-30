"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Carrusel de información del panel de auth. Rota solo cada `intervalMs` y los
 * puntos permiten saltar a una diapositiva. No es decorativo: cada slide muestra
 * información relevante del piloto.
 */
export function AuthCarousel({
  slides,
  intervalMs = 6000,
}: {
  slides: ReactNode[];
  intervalMs?: number;
}) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const actual = Math.min(index, count - 1);

  // Auto-avance. Se reinicia si cambia `index` (al seleccionar un punto también
  // se posterga el siguiente salto automático).
  useEffect(() => {
    if (count <= 1) return;
    const t = setTimeout(
      () => setIndex((i) => (i + 1) % count),
      intervalMs,
    );
    return () => clearTimeout(t);
  }, [index, count, intervalMs]);

  return (
    <div className="flex flex-col gap-6">
      <div>{slides[actual]}</div>

      {count > 1 && (
        <div className="flex gap-1.5" role="tablist" aria-label="Información del piloto">
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
                i === actual ? "w-6 bg-electric" : "w-3 bg-white/20 hover:bg-white/40",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
