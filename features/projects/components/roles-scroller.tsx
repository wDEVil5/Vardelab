"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Fila horizontal de roles.
 * Móvil: tarjetas ~85vw/20rem con peek (iteración móvil).
 * Desktop (lg+): como antes, exactamente 3 enteras a la vista.
 * Fades solo en lg+.
 */
export function RolesScroller({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const canScroll = el.scrollWidth > el.clientWidth + 1;
    setShowLeft(canScroll && el.scrollLeft > 1);
    setShowRight(
      canScroll && el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    );
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const raf = requestAnimationFrame(update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const mo = new MutationObserver(update);
    mo.observe(el, { childList: true, subtree: true });

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (el.scrollWidth <= el.clientWidth + 1) return;
      // En los extremos, deja pasar el scroll vertical de la página: si no,
      // un trackpad que solo baja (deltaX≈0) queda "atrapado" en la fila
      // mientras siga teniendo hacia dónde moverse horizontalmente.
      const enInicio = el.scrollLeft <= 0;
      const enFin = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      if ((e.deltaY < 0 && enInicio) || (e.deltaY > 0 && enFin)) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      el.removeEventListener("wheel", onWheel);
    };
  }, [update]);

  return (
    <div className="@container/roles relative mt-4">
      <div
        ref={ref}
        onScroll={update}
        className="-mx-1 flex gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth px-1 pb-1 scrollbar-none lg:mx-0 lg:px-0"
      >
        <div
          className={cn(
            "flex min-w-0 gap-3",
            // Móvil
            "*:w-[min(85vw,20rem)] *:min-w-[min(85vw,20rem)] *:shrink-0",
            "[&>*:only-child]:w-full [&>*:only-child]:min-w-0 [&>*:only-child]:max-w-xl",
            // Desktop: 3 tarjetas + 2 gaps, como antes
            "lg:*:w-[calc((100cqw-1.5rem)/3)] lg:*:min-w-[calc((100cqw-1.5rem)/3)]",
            "lg:[&>*:only-child]:w-[calc((100cqw-1.5rem)/3)] lg:[&>*:only-child]:min-w-[calc((100cqw-1.5rem)/3)] lg:[&>*:only-child]:max-w-none",
          )}
        >
          {children}
        </div>
      </div>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 hidden w-10 bg-[linear-gradient(to_right,rgb(255_255_255)_0%,rgb(255_255_255/0)_100%)] transition-opacity duration-200 lg:block",
          showLeft ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 hidden w-10 bg-[linear-gradient(to_left,rgb(255_255_255)_0%,rgb(255_255_255/0)_100%)] transition-opacity duration-200 lg:block",
          showRight ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
