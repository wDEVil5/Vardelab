"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Efecto "cortina" para el pie: el footer queda fijo al fondo del viewport,
 * detrás del contenido, y el contenido lo revela al llegar al final del scroll.
 *
 * Publica dos variables CSS en el documento:
 *  · `--footer-h`  → alto real del footer (ResizeObserver, responsive). El
 *    contenido lo usa como `margin-bottom` para reservar el tramo de revelado.
 *  · `--footer-rev` → progreso de revelado 0→1, para un leve parallax (el pie
 *    "sube" al destaparse). Se aplica solo en desktop y con movimiento permitido
 *    (regla `.footer-parallax` en globals.css); sin JS cae a 1 → sin transform.
 *
 * En móvil el footer va en flujo normal (`md:fixed`): si es más alto que el
 * viewport, la cortina fija dejaría su parte superior inaccesible.
 */
export function RevealFooter({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;

    const medir = () => root.style.setProperty("--footer-h", `${el.offsetHeight}px`);

    // Progreso de revelado: 0 tapado → 1 revelado del todo.
    const actualizarRev = () => {
      const h = el.offsetHeight || 1;
      const restante =
        document.documentElement.scrollHeight -
        window.scrollY -
        window.innerHeight;
      const revelado = Math.min(Math.max(h - restante, 0), h);
      root.style.setProperty("--footer-rev", String(revelado / h));
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(actualizarRev);
    };
    const onResize = () => {
      medir();
      if (!reduce) actualizarRev();
    };

    // Estado inicial en rAF (no sincrónico) para tenerlo antes del primer scroll.
    const initRaf = requestAnimationFrame(() => {
      medir();
      if (!reduce) actualizarRev();
    });

    const ro = new ResizeObserver(() => {
      medir();
      if (!reduce) actualizarRev();
    });
    ro.observe(el);
    window.addEventListener("resize", onResize, { passive: true });
    if (!reduce) window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(initRaf);
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      root.style.removeProperty("--footer-h");
      root.style.removeProperty("--footer-rev");
    };
  }, []);

  return (
    <div
      ref={ref}
      className="footer-parallax z-0 md:fixed md:inset-x-0 md:bottom-0"
    >
      {children}
    </div>
  );
}
