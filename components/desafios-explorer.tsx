"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type DesafioEjemplo = {
  titulo: string;
  texto: string;
  entregable: string;
};

// Intervalo del avance automático.
const AVANCE_MS = 4000;

/**
 * Explorador de ejemplos de desafíos. Avanza solo entre los ejemplos y se
 * detiene mientras el puntero (o el foco de teclado) está encima, para permitir
 * la lectura. También se puede navegar con click o hover en la lista. El fundido
 * al cambiar se dispara remontando el panel con `key`. Respeta reduced-motion:
 * con movimiento reducido no rota solo (queda bajo control del usuario).
 */
export function DesafiosExplorer({ items }: { items: DesafioEjemplo[] }) {
  const [activo, setActivo] = useState(0);
  const [pausado, setPausado] = useState(false);
  const actual = items[activo];

  // Avance automático con pausa. Depende de `activo` para reiniciar el conteo
  // tras cada cambio (automático o manual), manteniendo un ritmo parejo.
  useEffect(() => {
    if (pausado) return;
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
  }, [pausado, activo, items.length]);

  return (
    <div
      className="grid gap-4 lg:grid-cols-5 lg:gap-6"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      {/* Lista seleccionable. */}
      <ul className="flex flex-col gap-1 lg:col-span-2">
        {items.map((item, i) => {
          const on = i === activo;
          return (
            <li key={item.titulo}>
              <button
                type="button"
                onClick={() => setActivo(i)}
                onMouseEnter={() => setActivo(i)}
                aria-pressed={on}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200",
                  on
                    ? "border-electric/40 bg-electric/5"
                    : "border-transparent hover:bg-surface",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                    on
                      ? "bg-electric text-white"
                      : "bg-surface text-muted group-hover:bg-border",
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium transition-colors",
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

      {/* Panel de detalle (se remonta con `key` para el fundido al cambiar). */}
      <div className="lg:col-span-3">
        <div
          key={activo}
          className="animate-fade-in flex h-full flex-col justify-center gap-4 rounded-2xl border border-border bg-white p-8 sm:p-10"
        >
          <span className="text-6xl font-bold leading-none text-electric/15">
            0{activo + 1}
          </span>
          <h3 className="text-xl font-semibold text-ink sm:text-2xl">
            {actual.titulo}
          </h3>
          <p className="text-muted">{actual.texto}</p>
          <div className="mt-2 rounded-xl bg-surface p-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-electric">
              Entregable
            </span>
            <p className="mt-1 text-sm text-ink">{actual.entregable}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
