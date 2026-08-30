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
    const onScroll = () => setScrolled(window.scrollY > 8);
    // Estado inicial en rAF para no fijar estado sincrónico en el effect.
    const raf = requestAnimationFrame(onScroll);
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
