"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type Principio = {
  titulo: string;
  texto: string;
  practica: string;
  // `icon` se conserva por compatibilidad con los datos; este diseño no lo usa.
  icon?: string;
};

// Geometría del carril del trazo (coordenadas 1:1 con px).
const G = 108; // ancho del área del trazo
const RAIL_X = 26; // x del riel (donde están los puntos)
const BULGE = 24; // cuánto se curva el trazo entre puntos
const PAD = 26; // margen arriba/abajo para no pegar los puntos al borde

// Curva suave que pasa por los puntos (en RAIL_X) y se abomba alternadamente a
// los lados, dando un trazo orgánico "dibujado a mano".
function buildPath(ys: number[]): string {
  if (ys.length === 0) return "";
  let d = `M ${RAIL_X} ${ys[0]}`;
  for (let i = 1; i < ys.length; i++) {
    const yA = ys[i - 1];
    const yB = ys[i];
    const dir = i % 2 === 1 ? 1 : -1;
    d += ` C ${RAIL_X + dir * BULGE} ${yA + (yB - yA) * 0.35}, ${RAIL_X + dir * BULGE} ${yA + (yB - yA) * 0.65}, ${RAIL_X} ${yB}`;
  }
  return d;
}

/**
 * Principios como sección ANCLADA (pinned): el bloque queda fijo a pantalla y el
 * scroll avanza un trazo vivo (curva + cabeza cometa con halo) que enciende cada
 * punto; a la derecha, el principio en foco aparece con una entrada animada
 * (sube y se desenfoca, en cascada). Con `prefers-reduced-motion` se muestra el
 * primero, estático.
 *
 * Rendimiento: un listener de scroll con rAF; el trazo, la cometa y el halo se
 * ajustan por ref (sin re-render). Solo cambia el estado al pasar de principio.
 */
export function ScrollPrinciples({ items }: { items: Principio[] }) {
  const steps = items.length;
  const wrapRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const railRef = useRef<SVGPathElement>(null);
  const drawRef = useRef<SVGPathElement>(null);
  const cometRef = useRef<SVGCircleElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const totalLen = useRef(0);
  const activoRef = useRef(0);
  const visibleRef = useRef(true);
  const [activo, setActivo] = useState(0);
  const [ys, setYs] = useState<number[]>([]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const left = leftRef.current;
    const svg = svgRef.current;
    const rail = railRef.current;
    const draw = drawRef.current;
    if (!wrap || !left || !svg || !rail || !draw) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Recalcula la curva según el alto disponible del carril.
    const construir = () => {
      if (left.offsetParent === null) return; // oculto (móvil): no hay nada que medir
      const H = left.clientHeight;
      const nuevos = items.map((_, i) =>
        steps > 1 ? PAD + (i * (H - 2 * PAD)) / (steps - 1) : H / 2,
      );
      const d = buildPath(nuevos);
      svg.setAttribute("viewBox", `0 0 ${G} ${H}`);
      svg.style.height = `${H}px`;
      rail.setAttribute("d", d);
      draw.setAttribute("d", d);
      totalLen.current = draw.getTotalLength();
      draw.style.strokeDasharray = `${totalLen.current}`;
      setYs((prev) =>
        prev.length === nuevos.length && prev.every((v, i) => v === nuevos[i])
          ? prev
          : nuevos,
      );
    };

    const actualizar = () => {
      // Sección oculta (móvil / reduced-motion) o fuera de pantalla: no gastar
      // trabajo por frame (evita `getPointAtLength` en cada scroll de la página).
      if (wrap.offsetParent === null || !visibleRef.current) return;
      const comet = cometRef.current;
      const glow = glowRef.current;
      if (reduce) {
        draw.style.strokeDashoffset = "0";
        if (comet) comet.style.opacity = "0";
        if (glow) glow.style.opacity = "0";
        return;
      }
      const total = wrap.offsetHeight - window.innerHeight;
      const recorrido = Math.min(
        Math.max(-wrap.getBoundingClientRect().top, 0),
        Math.max(total, 1),
      );
      const progreso = total > 0 ? recorrido / total : 0;

      draw.style.strokeDashoffset = `${totalLen.current * (1 - progreso)}`;
      const pt = draw.getPointAtLength(progreso * totalLen.current);
      const visible = progreso > 0.005 && progreso < 0.995;
      if (comet) {
        comet.setAttribute("cx", `${pt.x}`);
        comet.setAttribute("cy", `${pt.y}`);
        comet.style.opacity = visible ? "1" : "0";
      }
      if (glow) {
        glow.style.transform = `translate(${pt.x - 48}px, ${pt.y - 48}px)`;
        glow.style.opacity = visible ? "1" : "0";
      }

      const idx = Math.min(steps - 1, Math.floor(progreso * steps));
      if (idx !== activoRef.current) {
        activoRef.current = idx;
        setActivo(idx);
      }
    };

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(actualizar);
    };

    construir();
    actualizar();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const ro = new ResizeObserver(() => {
      construir();
      actualizar();
    });
    ro.observe(left);
    // Solo trabaja cuando la sección está en pantalla; al entrar, refresca.
    const io = new IntersectionObserver(([e]) => {
      visibleRef.current = e.isIntersecting;
      if (e.isIntersecting) onScroll();
    });
    io.observe(wrap);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      ro.disconnect();
      io.disconnect();
    };
  }, [steps, items]);

  const foco = items[activo];

  return (
    <>
    {/* Versión pineada interactiva: solo en desktop y con movimiento permitido. */}
    <section
      ref={wrapRef}
      className="relative hidden bg-ink text-white motion-safe:md:block"
      style={{ height: `${steps * 100}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Glows ambientales sutiles. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-0 size-96 rounded-full bg-electric/10 blur-3xl"
        />

        <div className="mx-auto flex h-full max-w-6xl flex-col justify-center px-8">
          <div className="mb-12">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-electric">
              Principios
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white/90 sm:text-3xl">
              Cómo trabajamos.
            </h2>
          </div>

          <div className="grid items-center gap-14 md:grid-cols-[340px_1fr]">
            {/* Carril con el trazo vivo + etiquetas de los pasos. */}
            <div
              ref={leftRef}
              className="relative hidden h-[62vh] max-h-150 min-h-95 md:block"
            >
              <div
                ref={glowRef}
                aria-hidden
                className="absolute left-0 top-0 size-24 rounded-full bg-electric/30 blur-2xl transition-opacity duration-300"
                style={{ opacity: 0 }}
              />
              {/* Halo ambiental por punto: se enciende con el trazo. */}
              {ys.map((y, i) => (
                <div
                  key={`halo-${i}`}
                  aria-hidden
                  className="absolute size-28 rounded-full bg-electric/15 blur-2xl transition-opacity duration-700"
                  style={{
                    left: RAIL_X - 56,
                    top: y - 56,
                    opacity: i <= activo ? 1 : 0,
                  }}
                />
              ))}
              <svg
                ref={svgRef}
                width={G}
                className="absolute left-0 top-0 overflow-visible"
                fill="none"
              >
                <defs>
                  <linearGradient id="principiosGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#3867FF" />
                    <stop offset="1" stopColor="#62D5A2" />
                  </linearGradient>
                  <filter
                    id="cometGlow"
                    x="-300%"
                    y="-300%"
                    width="700%"
                    height="700%"
                  >
                    <feGaussianBlur stdDeviation="2.4" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <path
                  ref={railRef}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
                <path
                  ref={drawRef}
                  stroke="url(#principiosGrad)"
                  strokeWidth={2.75}
                  strokeLinecap="round"
                />
                {ys.map((y, i) => {
                  const on = i <= activo;
                  return (
                    <g key={i}>
                      <circle
                        cx={RAIL_X}
                        cy={y}
                        r={12}
                        fill="#3867FF"
                        style={{
                          opacity: on ? 0.18 : 0,
                          transition: "opacity 400ms",
                        }}
                      />
                      <circle
                        cx={RAIL_X}
                        cy={y}
                        r={5}
                        fill={on ? "#3867FF" : "#0D253B"}
                        stroke={on ? "#3867FF" : "rgba(255,255,255,0.3)"}
                        strokeWidth={1.75}
                        style={{ transition: "fill 400ms, stroke 400ms" }}
                      />
                    </g>
                  );
                })}
                <circle
                  ref={cometRef}
                  r={6}
                  fill="#fff"
                  filter="url(#cometGlow)"
                  style={{ opacity: 0 }}
                />
              </svg>

              {/* Etiquetas de cada paso, alineadas a su punto. */}
              {ys.map((y, i) => (
                <span
                  key={i}
                  className={cn(
                    "absolute -translate-y-1/2 text-sm font-medium transition-colors duration-300",
                    i <= activo ? "text-white" : "text-white/30",
                  )}
                  style={{ left: 62, top: y, width: 210 }}
                >
                  {items[i].titulo}
                </span>
              ))}
            </div>

            {/* Principio en foco: entra con vida en cada cambio (key = activo). */}
            <div key={activo} className="min-h-96">
              <h3 className="animate-principio text-4xl font-bold leading-[1.03] tracking-tight sm:text-6xl lg:text-7xl">
                {foco.titulo}
              </h3>
              <p
                className="animate-principio mt-8 max-w-xl text-lg leading-relaxed text-white/65 sm:text-xl"
                style={{ animationDelay: "110ms" }}
              >
                {foco.texto}
              </p>
              <div
                className="animate-principio mt-9 max-w-xl border-l-2 border-electric/70 pl-5"
                style={{ animationDelay: "210ms" }}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-electric">
                  En la práctica
                </span>
                <p className="mt-2 text-base leading-relaxed text-white/60">
                  {foco.practica}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Fallback estático apilado: móvil y `prefers-reduced-motion`. Muestra los
        cuatro principios sin depender del scroll (sin pin ni animación). */}
    <StackedPrincipios items={items} />
    </>
  );
}

// Íconos por principio (para la versión apilada de móvil / reduced-motion).
const ICONS: Record<string, React.ReactNode> = {
  alcance: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  hitos: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4h11l-2.5 3.5L16 11H5" />
    </>
  ),
  resultado: (
    <>
      <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  barrera: <path d="M4 20h4v-4h4v-4h4v-4h4" />,
};

// Tinte del badge por principio (aporta color para que no se vea plano).
const TINT: Record<string, string> = {
  alcance: "bg-electric/15 text-electric",
  hitos: "bg-electric/15 text-electric",
  resultado: "bg-sprout/15 text-sprout",
  barrera: "bg-coral/15 text-coral",
};

/**
 * Versión apilada como línea de tiempo: un riel conecta los principios, con un
 * badge de ícono sobre él y el contenido en tarjeta. Estática (sirve para móvil
 * y para `prefers-reduced-motion`).
 */
function StackedPrincipios({ items }: { items: Principio[] }) {
  return (
    <section className="block overflow-hidden bg-ink text-white motion-safe:md:hidden">
      <div className="mx-auto w-full max-w-2xl px-6 py-20 sm:py-24">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-electric">
          Principios
        </span>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Cómo trabajamos.
        </h2>

        <div className="relative mt-12">
          {/* Riel que conecta los pasos (detrás de los badges). */}
          <div
            aria-hidden
            className="absolute bottom-8 left-7 top-8 w-px bg-white/12"
          />

          <div className="flex flex-col gap-8">
            {items.map((p) => {
              const key = p.icon ?? "";
              return (
                <div key={p.titulo} className="relative flex gap-5">
                  {/* Badge de ícono sobre el riel. */}
                  <span
                    className={cn(
                      "relative z-10 flex size-14 shrink-0 items-center justify-center rounded-2xl ring-4 ring-ink",
                      TINT[key] ?? "bg-electric/15 text-electric",
                    )}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="size-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      {ICONS[key]}
                    </svg>
                  </span>

                  {/* Tarjeta de contenido. */}
                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/4 p-5">
                    <h3 className="text-xl font-bold tracking-tight">
                      {p.titulo}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">
                      {p.texto}
                    </p>
                    <div className="mt-4 border-l-2 border-electric/70 pl-4">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-electric">
                        En la práctica
                      </span>
                      <p className="mt-1 text-sm leading-relaxed text-white/55">
                        {p.practica}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
