"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Principio = { titulo: string; texto: string };

/**
 * Sección "anclada" (scroll storytelling): mientras se recorre, el contenido
 * queda fijo (sticky) y los principios aparecen uno por uno según el avance del
 * scroll; al revelarse el último, la sección se despega y sigue la página.
 *
 * Performante: un solo listener de scroll con `requestAnimationFrame` que solo
 * actualiza el índice activo (0..n-1); la aparición es `opacity`/`transform`.
 * Con `prefers-reduced-motion` se muestran todos de una.
 */
export function PinnedPrinciples({ items }: { items: Principio[] }) {
  const steps = items.length;
  const wrapRef = useRef<HTMLElement>(null);
  const [activo, setActivo] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (reduce) {
          setActivo(steps - 1);
          return;
        }
        const el = wrapRef.current;
        if (!el) return;
        const total = el.offsetHeight - window.innerHeight;
        const recorrido = Math.min(Math.max(-el.getBoundingClientRect().top, 0), total);
        const progreso = total > 0 ? recorrido / total : 0;
        // Revela el 1º al anclar, y el resto a 1/steps, 2/steps… del recorrido.
        setActivo(Math.min(steps - 1, Math.floor(progreso * steps)));
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [steps]);

  return (
    <section
      ref={wrapRef}
      className="relative bg-ink text-white"
      style={{ height: `${(steps + 1) * 100}vh` }}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        {/* Glows sutiles (dan profundidad sin coste de animación). */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 size-96 rounded-full bg-electric/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/4 size-72 rounded-full bg-sprout/10 blur-3xl"
        />

        <div className="relative mx-auto grid w-full max-w-5xl items-center gap-12 px-6 md:grid-cols-[1fr_1.3fr]">
          {/* Izquierda: título fijo + índice de pasos. */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-electric">
              Principios
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Experiencias claras para ambas partes.
            </h2>

            <div className="mt-8 flex flex-col gap-4">
              {items.map((p, i) => (
                <div key={p.titulo} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "h-px transition-all duration-500",
                      i === activo ? "w-10 bg-electric" : "w-5 bg-white/20",
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium transition-colors duration-500",
                      i === activo ? "text-white" : "text-white/35",
                    )}
                  >
                    0{i + 1} · {p.titulo}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Derecha: el principio activo, grande, con número de fondo. */}
          <div className="relative min-h-56">
            {items.map((p, i) => {
              const visible = i === activo;
              return (
                <div
                  key={p.titulo}
                  aria-hidden={!visible}
                  className={cn(
                    "absolute inset-0 flex flex-col justify-center transition-all duration-500 ease-out",
                    visible
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none translate-y-6 opacity-0",
                  )}
                >
                  <span className="text-7xl font-bold leading-none text-white/10">
                    0{i + 1}
                  </span>
                  <h3 className="mt-4 text-2xl font-bold sm:text-3xl">
                    {p.titulo}
                  </h3>
                  <p className="mt-3 max-w-md leading-relaxed text-white/70">
                    {p.texto}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
