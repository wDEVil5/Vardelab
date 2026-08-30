"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Efecto "cortina" para el pie: el footer queda fijo al fondo del viewport,
 * detrás del contenido. El contenido (con fondo opaco y z superior) lo cubre;
 * al llegar al final del scroll, se corre hacia arriba y lo revela.
 *
 * Mide el alto real del footer (ResizeObserver, adaptable a responsive) y lo
 * publica como variable CSS `--footer-h` en el documento. El contenido usa esa
 * variable como margen inferior (el tramo de scroll donde se destapa) y un alto
 * mínimo de viewport, para que en páginas cortas el footer quede cubierto en
 * reposo y solo se revele al hacer scroll.
 */
export function RevealFooter({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const measure = () =>
      root.style.setProperty("--footer-h", `${el.offsetHeight}px`);
    // Medición inicial en rAF para no fijar estado sincrónico en el effect.
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      root.style.removeProperty("--footer-h");
    };
  }, []);

  return (
    <div ref={ref} className="fixed inset-x-0 bottom-0 z-0">
      {children}
    </div>
  );
}
