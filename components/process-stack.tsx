"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type ProcesoPaso = { titulo: string; texto: string; icon: ProcesoIcon };

const COLORES = [
  { bg: "bg-electric", text: "text-white", chip: "bg-white/15" },
  { bg: "bg-deep", text: "text-white", chip: "bg-white/15" },
  { bg: "bg-sprout", text: "text-ink", chip: "bg-ink/10" },
  { bg: "bg-coral", text: "text-white", chip: "bg-white/15" },
];

// Offset (px) del primer nodo respecto al top del viewport, y cuánto se
// desplaza cada nodo siguiente — deja asomado un margen de color de la
// tarjeta de abajo, como fichas de un mazo.
const TOP_BASE = 80;
const TOP_PASO = 18;
// Cuánto scroll (px) toma la transición de escala/blur de cada tarjeta,
// igual que `scaleEndPosition` del `ScrollStack` original.
const DISTANCIA_ACTIVACION = 320;
// Escala final de la tarjeta más al fondo (i=0); cada tarjeta siguiente
// termina un poco menos achicada — mismo criterio que `baseScale`/`itemScale`
// del componente de referencia.
const ESCALA_BASE = 0.75;
const ESCALA_POR_NIVEL = 0.05;
const BLUR_MAX = 8;
// Margen (%) fuera del viewport en el que ya se conecta/desconecta el
// listener de scroll — evita quedar "corto" y notarse un salto al entrar.
const MARGEN_RANGO = 100;

/**
 * Tarjetas apiladas con scroll: cada paso queda `sticky` a una altura
 * ligeramente mayor que el anterior (mismo truco de `top` escalonado que usan
 * los decks de tarjetas nativos en CSS — sin Lenis ni pin manual por JS), así
 * que al scrollear una tapa a la otra dejando un margen de color asomado,
 * como un mazo de cartas. La única pieza en JS es cosmética: a medida que se
 * acumulan tarjetas encima, las de más abajo se achican y desenfocan un poco
 * (profundidad), calculado contra `getBoundingClientRect` de la siguiente
 * tarjeta — el mismo patrón de "objetivo + resorte" que ya usa `SiteHeaderBar`.
 * Adaptación nativa del efecto "ScrollStack" de reactbits.dev que trajo el
 * dueño del producto: ese usa Lenis para remplazar el scroll de toda la
 * página (desproporcionado para una sola sección de 4 pasos cortos) y calcula
 * el achicado de cada tarjeta contra su propia posición estática en el
 * documento (`offsetTop`) comparada con el scroll actual — no contra si "ya
 * hay N tarjetas encima", que se sentía escalonado/con saltos en vez de
 * suave. Esta versión sigue el mismo criterio que el original: cada tarjeta
 * tiene su propia ventana de scroll (`DISTANCIA_ACTIVACION` px) en la que pasa
 * de tamaño normal a su escala final, calculada en cada frame directamente a
 * partir de `scrollY` — continuo, sin pasos discretos ni transición CSS
 * persiguiendo un valor. El `scroll` de `window` solo se conecta mientras la
 * sección está cerca del viewport (via `IntersectionObserver`), y cada frame
 * se salta la escritura al DOM si el valor no cambió respecto al anterior —
 * si no, cualquier scroll en OTRA parte de una página larga recalcularía
 * estas 4 tarjetas para nada.
 */
export function ProcessStack({ titulo, pasos }: { titulo: string; pasos: ProcesoPaso[] }) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const disparadoresRef = useRef<number[]>([]);
  const ultimoPintadoRef = useRef<number[]>([]);
  const rafRef = useRef(0);

  useEffect(() => {
    const el = contenedorRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Posición estática (como si no fuera `sticky`) de cada tarjeta en el
    // documento, menos su propio offset de apilado — el punto de scroll en el
    // que esa tarjeta empieza a considerarse "cubierta".
    const medir = () => {
      // Limpia cualquier `transform` antes de medir: `getBoundingClientRect`
      // devuelve el rectángulo YA transformado (visual), no el de layout —
      // con una tarjeta achicada a mitad de camino, la medición saldría mal.
      cardRefs.current.forEach((c) => {
        if (c) c.style.transform = "";
      });
      disparadoresRef.current = cardRefs.current.map((c, i) => {
        if (!c) return 0;
        const staticTop = c.getBoundingClientRect().top + window.scrollY;
        return staticTop - (TOP_BASE + i * TOP_PASO);
      });
    };

    const pintar = () => {
      const scrollY = window.scrollY;
      cardRefs.current.forEach((c, i) => {
        if (!c) return;

        // El achicado/blur de la tarjeta i tiene que seguir a la tarjeta
        // SIGUIENTE (la que la tapa), no a su propio punto de scroll — antes
        // dependía de cuándo la tarjeta i misma se pegaba arriba, que casi
        // nunca coincidía con el momento real en que la siguiente empezaba a
        // cubrirla (se sentía desfasado). Así: progreso 0 cuando la
        // siguiente está a `DISTANCIA_ACTIVACION` px de llegar, progreso 1
        // justo cuando la siguiente termina de pegarse — sincronizado con lo
        // que se ve. La última tarjeta no tiene quién la tape: se queda
        // siempre a tamaño normal.
        const esUltima = i === cardRefs.current.length - 1;
        const disparadorSiguiente = esUltima ? null : (disparadoresRef.current[i + 1] ?? 0);
        const progreso = esUltima
          ? 0
          : Math.min(
              1,
              Math.max(0, (scrollY - (disparadorSiguiente! - DISTANCIA_ACTIVACION)) / DISTANCIA_ACTIVACION),
            );

        // Sin cambio real respecto al último frame pintado (ya llegó a 0 o a
        // 1 y se quedó ahí) → no tocar el DOM. Evita forzar recálculo de
        // estilos/repintado en cada scroll de la página una vez que esta
        // tarjeta ya no se está moviendo.
        if (ultimoPintadoRef.current[i] === progreso) return;
        ultimoPintadoRef.current[i] = progreso;

        // Progreso "adelantado" (ease-out) solo para el achicado/blur: para
        // que se note apenas la tapa la siguiente, no recién cuando ya casi
        // terminó de cubrirla — con progreso lineal, a la mitad del cover
        // recién iba como 1/3 de achicada; así a la mitad ya va como 3/4.
        const progresoAdelantado = 1 - (1 - progreso) ** 2;
        const escalaObjetivo = ESCALA_BASE + i * ESCALA_POR_NIVEL;
        const escala = 1 - progresoAdelantado * (1 - escalaObjetivo);
        const blur = progresoAdelantado * BLUR_MAX * (1 - i / (pasos.length - 1 || 1));

        if (progreso <= 0) {
          c.style.transform = "";
          c.style.filter = "";
        } else {
          c.style.transform = `scale(${escala.toFixed(3)})`;
          c.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : "";
        }

        // El título se tapa con la tarjeta 1 apenas empieza a cubrirla —
        // ahora usa el mismo `progreso` recién corregido (sincronizado con la
        // tarjeta 2 acercándose), no un valor propio de la tarjeta 1.
        if (i === 0 && tituloRef.current) {
          const opacidad = 1 - progreso;
          tituloRef.current.style.opacity = opacidad.toFixed(2);
        }
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(pintar);
    };

    // El listener de scroll solo se conecta mientras la sección anda cerca
    // del viewport — si no, cada scroll en CUALQUIER parte de la página
    // (aunque este componente esté a miles de píxeles de distancia) recalcula
    // las 4 tarjetas para nada.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Sin `medir()` acá: si se vuelve a llamar después de que alguna
          // tarjeta ya tiene `scale(...)` aplicado, `getBoundingClientRect`
          // devuelve el rectángulo YA achicado, no el real — corrompe los
          // disparadores para el resto del scroll (esto era lo que hacía
          // que el título volviera a asomar más adelante). Medir posiciones
          // una sola vez, antes de que exista cualquier transform.
          pintar();
          window.addEventListener("scroll", onScroll, { passive: true });
        } else {
          window.removeEventListener("scroll", onScroll);
          cancelAnimationFrame(rafRef.current);
        }
      },
      { rootMargin: `${MARGEN_RANGO}% 0px` },
    );
    observer.observe(el);

    const onResize = () => {
      medir();
      ultimoPintadoRef.current = [];
      pintar();
    };

    medir();
    pintar();
    window.addEventListener("resize", onResize);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [pasos.length]);


  return (
    <div ref={contenedorRef} className="relative">
      <h2
        ref={tituloRef}
        className="sticky top-20 z-0 mb-10 text-center text-2xl font-bold tracking-tight text-ink sm:text-3xl"
      >
        {titulo}
      </h2>
      {pasos.map((paso, i) => {
        const color = COLORES[i % COLORES.length];
        return (
          <div
            key={paso.titulo}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="sticky mb-6 origin-top will-change-transform last:mb-0"
            style={{ top: TOP_BASE + i * TOP_PASO, zIndex: i + 1 }}
          >
            <div
              className={cn(
                "flex min-h-64 items-center gap-6 rounded-3xl p-8 shadow-[0_20px_40px_-24px_rgba(13,37,59,0.35)] sm:min-h-80 sm:p-12",
                color.bg,
                color.text,
              )}
            >
              <div className="min-w-0 flex-1">
                <span
                  className={cn(
                    "inline-flex size-9 items-center justify-center rounded-full text-base font-bold",
                    color.chip,
                  )}
                >
                  {i + 1}
                </span>
                <h3 className="mt-5 text-2xl font-bold sm:text-3xl">{paso.titulo}</h3>
                <p className={cn("mt-3 max-w-sm text-base leading-relaxed sm:text-lg", color.text === "text-white" ? "text-white/80" : "text-ink/70")}>
                  {paso.texto}
                </p>
              </div>
              <span
                className={cn(
                  "hidden size-28 shrink-0 items-center justify-center rounded-2xl sm:flex sm:size-36",
                  color.chip,
                )}
                aria-hidden
              >
                <ProcesoIconSvg name={paso.icon} className="size-12 sm:size-16" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type ProcesoIcon = "mensaje" | "objetivo" | "personas" | "check";

function ProcesoIconSvg({ name, className }: { name: ProcesoIcon; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className,
  };
  switch (name) {
    case "mensaje":
      return (
        <svg {...common}>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      );
    case "objetivo":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1" />
        </svg>
      );
    case "personas":
      return (
        <svg {...common}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="10" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="M22 4 12 14.01l-3-3" />
        </svg>
      );
  }
}
