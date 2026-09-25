"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Acordeón de preguntas frecuentes (una abierta a la vez). El contenido
 * se expande con una fila de grid y un fundido; el espacio inferior vive
 * dentro de la fila para evitar animar el padding del contenedor.
 */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [abierta, setAbierta] = useState<number | null>(null);

  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
      {items.map((item, i) => {
        const open = abierta === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setAbierta(open ? null : i)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-surface/60"
            >
              <span className="font-medium text-ink">{item.q}</span>
              <span
                aria-hidden
                className={cn(
                  "shrink-0 text-xl leading-none text-muted transition-transform duration-300",
                  open ? "rotate-45 text-electric" : "rotate-0",
                )}
              >
                +
              </span>
            </button>
            <div
              className={cn(
                "grid px-6 transition-[grid-template-rows,opacity] duration-400 ease-out motion-reduce:transition-none",
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <p className="pb-5 text-sm leading-relaxed text-muted">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
