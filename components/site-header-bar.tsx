"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Distancia de scroll (px) sobre la que se completa el efecto.
const RANGO = 160;
// Ancho máximo sin scrollear: bien holgado, casi de punta a punta en
// pantallas normales (el gutter real lo da el padding del contenido interno).
// Al scrollear se contrae hasta ANCHO_CONTENIDO: el mismo max-w-5xl (1024px)
// que usa el resto del sitio para el body/main, así la píldora scrolleada
// queda alineada con el contenido de la página, no con un ancho inventado.
const ANCHO_COMPLETO = 1280;
const ANCHO_CONTENIDO = 1024;
// Qué tan rápido el valor "actual" alcanza al "objetivo" cada frame (0-1).
// Bajo = más inercia/retraso (se siente con peso propio); alto = casi 1:1
// con el scroll.
const SUAVIZADO = 0.09;
const UMBRAL_REPOSO = 0.0008;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Barra del header con efecto "flotante": se contrae en vivo a medida que se
 * scrollea (inspirado en el navbar de reactbits.dev), pero no sigue el scroll
 * 1:1 — eso se sentía demasiado "pegado", como si no tuviera vida propia. En
 * vez de aplicar `scrollY` directamente, hay un valor objetivo (lo que pide
 * el scroll) y un valor actual que lo persigue con inercia (`SUAVIZADO`) en
 * un loop de `requestAnimationFrame` que corre mientras haya diferencia entre
 * ambos — así el header sigue "acomodándose" un instante después de que el
 * scroll se detiene, como un resorte suave, no como una barra de progreso.
 * Estilos inline (no clases/transition de Tailwind) porque el valor se
 * recalcula a mano cada frame.
 * Sticky (no fixed) para conservar su espacio en el flujo. La píldora queda
 * pegada arriba (sin marginTop): al scrollear solo se encoge y redondea.
 */
export function SiteHeaderBar({ children }: { children: ReactNode }) {
  const pillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let objetivo = 0;
    let actual = 0;
    let raf = 0;
    let corriendo = false;

    // Cacheado (no leído en cada frame de `pintar`): el layout solo cambia
    // cuando cruza el breakpoint, así que basta escuchar ese evento.
    const mq = window.matchMedia("(max-width: 767px)");
    let mobile = mq.matches;
    const onMqChange = (e: MediaQueryListEvent) => {
      mobile = e.matches;
    };
    mq.addEventListener("change", onMqChange);

    const pintar = (t: number) => {
      const el = pillRef.current;
      if (!el) return;
      // La tarjeta queda siempre pegada arriba (sin hueco). Al scrollear se
      // encoge y redondea; en móvil también, con un margen lateral suave.
      if (mobile) {
        const inset = lerp(0, 12, t);
        el.style.maxWidth = "100%";
        el.style.width = `calc(100% - ${inset * 2}px)`;
        el.style.marginLeft = "auto";
        el.style.marginRight = "auto";
        el.style.borderRadius = `${lerp(0, 20, t)}px`;
      } else {
        el.style.width = "";
        el.style.maxWidth = `${lerp(ANCHO_COMPLETO, ANCHO_CONTENIDO, t)}px`;
        el.style.marginLeft = "";
        el.style.marginRight = "";
        el.style.borderRadius = `${lerp(0, 28, t)}px`;
      }
      el.style.marginTop = "0px";
      // En reposo: blanco sólido igual que body/main (--background), para que
      // no se note una costura de color con el hero (p. ej. glow detrás).
      // Al scrollear: vidrio suave + borde del token --color-border (#e3e8ee).
      // La clase `bg-white` del nodo cubre el primer paint (SSR / pre-hydrate);
      // sin ella el fondo solo existía tras el useEffect y se veía un flash.
      el.style.backgroundColor = `rgba(255, 255, 255, ${lerp(1, 0.92, t)})`;
      el.style.borderColor = `rgba(227, 232, 238, ${lerp(0, 1, t)})`;
      el.style.boxShadow = `0 10px 30px -12px rgba(15, 23, 42, ${lerp(0, 0.18, t)})`;
    };

    const tick = () => {
      actual = lerp(actual, objetivo, SUAVIZADO);
      pintar(actual);
      if (Math.abs(objetivo - actual) > UMBRAL_REPOSO) {
        raf = requestAnimationFrame(tick);
      } else {
        actual = objetivo;
        pintar(actual);
        corriendo = false;
      }
    };

    const onScroll = () => {
      objetivo = Math.min(1, Math.max(0, window.scrollY / RANGO));
      if (!corriendo) {
        corriendo = true;
        raf = requestAnimationFrame(tick);
      }
    };

    onScroll();
    pintar(actual);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      mq.removeEventListener("change", onMqChange);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 flex justify-center">
      <div
        ref={pillRef}
        className="w-full border border-transparent bg-white backdrop-blur-md"
      >
        {children}
      </div>
    </header>
  );
}
