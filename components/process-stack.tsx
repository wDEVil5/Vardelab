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
const TOP_BASE = 72;
const TOP_PASO = 14;
// Escala final de la tarjeta más al fondo (i=0); cada tarjeta siguiente
// termina un poco menos achicada — mismo criterio que `baseScale`/`itemScale`
// del componente de referencia.
const ESCALA_BASE = 0.88;
const ESCALA_POR_NIVEL = 0.03;
const BLUR_MAX = 2.5;
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
 * achica en cascada a mitad del viaje de la tarjeta que la tapa, calculado
 * en cada frame desde `scrollY` — continuo, sin pasos discretos. El `scroll`
 * de `window` solo se conecta mientras la
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

    let escuchandoScroll = false;

    // Posición de layout en el documento (no la visual sticky).
    // `getBoundingClientRect` falla si la página carga a mitad de la sección:
    // la tarjeta ya está "pegada" y el top visual no es el top real del flujo,
    // y los disparadores quedan corruptos → el efecto deja de responder al
    // subir/bajar. `offsetTop` respecto al contenedor sí es la posición estática.
    const medir = () => {
      cardRefs.current.forEach((c) => {
        if (!c) return;
        c.style.transform = "";
        c.style.filter = "";
      });
      if (tituloRef.current) tituloRef.current.style.opacity = "";

      const rootTop = el.getBoundingClientRect().top + window.scrollY;
      disparadoresRef.current = cardRefs.current.map((c, i) => {
        if (!c) return 0;
        return rootTop + c.offsetTop - (TOP_BASE + i * TOP_PASO);
      });
      ultimoPintadoRef.current = [];
    };

    const pintar = () => {
      const scrollY = window.scrollY;
      cardRefs.current.forEach((c, i) => {
        if (!c) return;

        // Cascada: profundidad de i sigue el viaje de la siguiente. Progreso
        // 0 al pegarse la actual; 1 a mitad de camino de la que la tapa.
        const esUltima = i === cardRefs.current.length - 1;
        const disparadorActual = disparadoresRef.current[i] ?? 0;
        const disparadorSiguiente = esUltima
          ? null
          : (disparadoresRef.current[i + 1] ?? 0);
        const viaje = esUltima
          ? 0
          : Math.max((disparadorSiguiente as number) - disparadorActual, 1);
        const finCascada = disparadorActual + viaje * 0.5;
        const progresoCrudo = esUltima
          ? 0
          : Math.min(
              1,
              Math.max(
                0,
                (scrollY - disparadorActual) /
                  Math.max(finCascada - disparadorActual, 1),
              ),
            );
        // Cuantizar para el cache: evita falsos "sin cambio" por floats.
        const progreso = Math.round(progresoCrudo * 1000) / 1000;

        if (ultimoPintadoRef.current[i] === progreso) return;
        ultimoPintadoRef.current[i] = progreso;

        const progresoAdelantado = 1 - (1 - progreso) ** 2;
        const escalaObjetivo = ESCALA_BASE + i * ESCALA_POR_NIVEL;
        const escala = 1 - progresoAdelantado * (1 - escalaObjetivo);
        const blur =
          progresoAdelantado * BLUR_MAX * (1 - i / (pasos.length - 1 || 1));

        if (progreso <= 0) {
          c.style.transform = "";
          c.style.filter = "";
        } else {
          c.style.transform = `scale(${escala.toFixed(3)})`;
          c.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : "";
        }

        if (i === 0 && tituloRef.current) {
          tituloRef.current.style.opacity = (1 - progreso).toFixed(2);
        }
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(pintar);
    };

    const activarScroll = () => {
      // Remedir siempre al entrar: corrige carga a mitad de sección y
      // vuelve a calibrar si el layout cambió mientras estaba fuera.
      medir();
      pintar();
      if (!escuchandoScroll) {
        window.addEventListener("scroll", onScroll, { passive: true });
        escuchandoScroll = true;
      }
    };

    const desactivarScroll = () => {
      if (escuchandoScroll) {
        window.removeEventListener("scroll", onScroll);
        escuchandoScroll = false;
      }
      cancelAnimationFrame(rafRef.current);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) activarScroll();
        else desactivarScroll();
      },
      { rootMargin: `${MARGEN_RANGO}% 0px` },
    );
    observer.observe(el);

    const onResize = () => {
      medir();
      pintar();
    };

    // Restauración de scroll del navegador / back-forward cache.
    const onPageShow = () => {
      medir();
      pintar();
    };

    medir();
    pintar();
    window.addEventListener("resize", onResize);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      observer.disconnect();
      desactivarScroll();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [pasos.length]);


  return (
    <div ref={contenedorRef} className="relative">
      <h2
        ref={tituloRef}
        className="sticky top-18 z-0 mb-8 text-center text-2xl font-bold tracking-tight text-ink sm:mb-10 sm:text-3xl"
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
            className="sticky mb-5 origin-top will-change-transform last:mb-0"
            style={{ top: TOP_BASE + i * TOP_PASO, zIndex: i + 1 }}
          >
            <div
              className={cn(
                "flex h-64 items-center gap-5 rounded-3xl p-7 shadow-[0_16px_36px_-24px_rgba(13,37,59,0.28)] sm:h-72 sm:gap-6 sm:p-10",
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
