"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type DesafioEjemplo = {
  titulo: string;
  texto: string;
  entregable: string;
};

const AVANCE_MS = 4000;

/**
 * Explorador de ejemplos de desafíos.
 * Desktop (lg+): lista con título + tarjeta (sin el cambio a solo números).
 * Móvil/tablet: solo números a la izquierda y tarjeta a la derecha.
 * Autoavance; pausa solo al leer la tarjeta. Respeta reduced-motion.
 */
export function DesafiosExplorer({ items }: { items: DesafioEjemplo[] }) {
  const [activo, setActivo] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [enVista, setEnVista] = useState(true);
  const [pestanaActiva, setPestanaActiva] = useState(true);
  const contRef = useRef<HTMLDivElement>(null);
  const actual = items[activo];

  useEffect(() => {
    const el = contRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setEnVista(e.isIntersecting));
    io.observe(el);
    const onVis = () => setPestanaActiva(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    if (pausado || !enVista || !pestanaActiva) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const id = window.setInterval(() => {
      setActivo((a) => (a + 1) % items.length);
    }, AVANCE_MS);
    return () => window.clearInterval(id);
  }, [pausado, enVista, pestanaActiva, activo, items.length]);

  return (
    <div
      ref={contRef}
      className="grid grid-cols-[auto_1fr] items-stretch gap-3 sm:gap-5 lg:grid-cols-5 lg:gap-6"
    >
      <ul
        className="flex flex-col gap-1.5 self-center lg:col-span-2 lg:gap-1 lg:self-auto"
        role="tablist"
        aria-label="Ejemplos de desafíos"
      >
        {items.map((item, i) => {
          const on = i === activo;
          return (
            <li key={item.titulo}>
              <button
                type="button"
                role="tab"
                aria-selected={on}
                aria-label={item.titulo}
                title={item.titulo}
                onClick={() => setActivo(i)}
                onMouseEnter={() => setActivo(i)}
                className={cn(
                  "group flex items-center transition-colors duration-200",
                  // Móvil: solo el número.
                  "size-9 justify-center rounded-xl text-sm font-semibold sm:size-10",
                  on
                    ? "bg-electric text-white"
                    : "bg-surface text-muted hover:bg-border hover:text-ink",
                  // Desktop: fila con número + título.
                  "lg:h-auto lg:w-full lg:justify-start lg:gap-3 lg:rounded-xl lg:border lg:px-4 lg:py-3 lg:text-left",
                  on
                    ? "lg:border-electric/40 lg:bg-electric/5"
                    : "lg:border-transparent lg:bg-transparent lg:hover:bg-surface",
                )}
              >
                <span
                  className={cn(
                    "lg:flex lg:size-7 lg:shrink-0 lg:items-center lg:justify-center lg:rounded-lg lg:text-xs lg:font-semibold",
                    on
                      ? "lg:bg-electric lg:text-white"
                      : "lg:bg-surface lg:text-muted lg:group-hover:bg-border",
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-sm font-medium lg:inline",
                    on ? "text-ink" : "text-muted group-hover:text-ink",
                  )}
                >
                  {item.titulo}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div
        className="min-w-0 lg:col-span-3"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        onFocus={() => setPausado(true)}
        onBlur={() => setPausado(false)}
      >
        <div
          key={activo}
          role="tabpanel"
          aria-label={actual.titulo}
          className="animate-fade-in flex min-h-58 flex-col gap-3 rounded-2xl border border-border bg-white p-5 sm:min-h-62 sm:gap-3.5 sm:p-6 lg:h-full lg:min-h-72 lg:justify-center lg:gap-4 lg:p-8 xl:p-10"
        >
          <div className="flex flex-col gap-2 sm:gap-2.5 lg:gap-4">
            <h3 className="line-clamp-2 text-lg font-semibold text-ink sm:text-xl lg:text-2xl">
              {actual.titulo}
            </h3>
            <p className="line-clamp-3 text-sm text-muted sm:text-base">
              {actual.texto}
            </p>
          </div>
          <div className="mt-auto rounded-xl bg-surface p-3 sm:p-3.5 lg:mt-2 lg:p-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-electric">
              Entregable
            </span>
            <p className="mt-1 line-clamp-3 text-sm text-ink">
              {actual.entregable}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
