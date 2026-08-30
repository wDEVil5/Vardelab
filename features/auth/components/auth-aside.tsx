"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Panel de marca de las pantallas de auth (solo desktop). Arriba la marca y el
 * tagline; en el medio el carrusel de información (rota solo y se puede saltar
 * con los puntos); abajo, los puntos y el pie. Si cambia `resetKey` (p. ej. el
 * rol en el registro) vuelve a la primera diapositiva.
 */
export function AuthAside({
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

  // Volver a la primera diapositiva cuando cambia el contexto (patrón de React:
  // ajustar estado en el render comparando con el valor previo).
  const [prevKey, setPrevKey] = useState(resetKey);
  if (resetKey !== prevKey) {
    setPrevKey(resetKey);
    setIndex(0);
  }

  const actual = Math.min(index, count - 1);

  // Pausa el auto-avance mientras el cursor (o el foco) está sobre el panel, para
  // poder leer con calma.
  const [pausado, setPausado] = useState(false);

  // Auto-avance; se reinicia al cambiar de diapositiva, elegir un punto o pausar.
  useEffect(() => {
    if (count <= 1 || pausado) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => clearTimeout(t);
  }, [index, count, intervalMs, pausado]);

  return (
    <aside
      className="hidden min-h-screen w-90 shrink-0 flex-col rounded-r-3xl bg-ink p-10 text-white lg:flex"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={() => setPausado(false)}
    >
      {/* Marca + tagline. */}
      <div className="flex flex-col gap-6">
        <Link href="/" className="text-2xl font-bold">
          CampusLab
        </Link>
        <p className="text-3xl font-bold leading-snug">
          Tu espacio para conectar talento y desafíos reales.
        </p>
      </div>

      {/* Espaciadores proporcionales: dejan la slide en el tercio superior. */}
      <div className="flex-1" aria-hidden />
      <div key={`${resetKey ?? ""}-${actual}`} className="animate-fade-in">
        {slides[actual]}
      </div>
      <div className="flex-2" aria-hidden />

      {/* Puntos del carrusel (centrados) + pie, al fondo. */}
      <div className="flex flex-col items-center gap-6">
        {count > 1 && (
          <div
            className="flex justify-center gap-1.5"
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
        <p className="text-sm text-white/60">Piloto independiente</p>
      </div>
    </aside>
  );
}
