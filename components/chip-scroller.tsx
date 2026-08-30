"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Fila de chips con un elemento fijo a la izquierda (p. ej. "Todos") y el resto
 * en scroll horizontal. Muestra un degradado de desvanecimiento en cada lado
 * solo cuando hay contenido oculto en esa dirección. La barra de scroll se
 * oculta; se navega con rueda/trackpad, arrastre táctil o el foco de teclado.
 */
export function ChipScroller({
  pinned,
  children,
}: {
  pinned: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  // Recalcula qué degradados mostrar según la posición de scroll.
  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 1);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // El cálculo inicial va en rAF para no fijar estado sincrónico en el effect.
    const raf = requestAnimationFrame(update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [update]);

  return (
    <div className="flex items-center gap-2">
      <div className="shrink-0">{pinned}</div>
      <div className="relative min-w-0 flex-1">
        <div
          ref={ref}
          onScroll={update}
          className="flex gap-2 overflow-x-auto scroll-smooth py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-surface to-transparent transition-opacity duration-200",
            showLeft ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-surface to-transparent transition-opacity duration-200",
            showRight ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
    </div>
  );
}
