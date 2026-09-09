"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Barra del header con efecto "flotante": queda fija arriba (sticky) y translúcida
 * con desenfoque. Al inicio se funde con la página (sin borde); al hacer scroll
 * aparece un borde y una sombra sutil para separarla del contenido. Sticky (no
 * fixed) para conservar su espacio en el flujo y no romper los cálculos de alto.
 */
export function SiteHeaderBar({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ultimo = false;
    const aplicar = () => {
      const s = window.scrollY > 8;
      if (s !== ultimo) {
        ultimo = s;
        setScrolled(s);
      }
    };
    // Throttle con rAF: coalesce los eventos de scroll a uno por frame.
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(aplicar);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300",
        scrolled
          ? "border-border bg-white/80 shadow-sm"
          : "border-transparent bg-white/60",
      )}
    >
      {children}
    </header>
  );
}
