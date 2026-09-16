"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type Principio = {
  titulo: string;
  texto: string;
  practica: string;
  icon?: string;
};

/**
 * Una narrativa horizontal ligada al scroll vertical. La sección no bloquea ni
 * altera el scroll: solo traduce el avance natural de la página al carril de
 * tarjetas. La composición usa espacio negativo y módulos escalonados para
 * que el desplazamiento horizontal sea el efecto protagonista.
 */
export function ScrollPrinciples({ items }: { items: Principio[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const container = containerRef.current;
    const track = trackRef.current;
    const opener = openerRef.current;
    if (!section || !container || !track || !opener) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const GAP = 64; // gap-16, mismo valor que separa las tarjetas del riel.
    // Al inicio la pareja "apertura + tarjeta 1" debe verse centrada como
    // bloque, no la tarjeta 1 sola: esto reemplaza el `pl-[20vw]` fijo por
    // uno calculado, y ese mismo cálculo posiciona la apertura a su izquierda.
    // Se centra contra el ancho real del contenedor (`max-w-7xl`), no contra
    // `window.innerWidth`: en pantallas más anchas que 80rem el contenedor no
    // ocupa todo el viewport, así que centrar contra la ventana dejaba todo
    // corrido hacia la derecha.
    let pairLeft = 0;
    let card1X = 0;

    const layout = () => {
      const cardWidth = opener.offsetWidth;
      const pairWidth = cardWidth * 2 + GAP;
      const containerWidth = container.getBoundingClientRect().width;
      pairLeft = Math.max((containerWidth - pairWidth) / 2, 0);
      card1X = pairLeft + cardWidth + GAP;
      track.style.paddingLeft = `${card1X}px`;
    };

    let frame = 0;
    const update = () => {
      const total = Math.max(section.offsetHeight - window.innerHeight, 1);
      const travelled = Math.min(
        Math.max(-section.getBoundingClientRect().top, 0),
        total,
      );
      const progress = travelled / total;

      // En vez de una distancia lineal fija, cada tarjeta tiene su propio
      // "punto de centrado": cuánto hay que trasladar el riel para que quede
      // exactamente al centro del contenedor (mismo criterio que centra el
      // par de apertura). Así la última tarjeta termina con el mismo trato
      // que la primera — el margen final queda simétrico por construcción,
      // no por un colchón ajustado a mano.
      const containerWidth = container.getBoundingClientRect().width;
      const cardWidth = opener.offsetWidth;
      const step = cardWidth + GAP;
      const centerOf = (i: number) => card1X + i * step + cardWidth / 2;
      // Se centra el promedio de los centros de las tarjetas 0..i (no cada
      // tarjeta sola): ese promedio crece de forma pareja hacia la derecha a
      // medida que se suman tarjetas, así el riel siempre avanza hacia la
      // izquierda sin retroceder nunca. En la última tarjeta el promedio
      // coincide exactamente con el centro del grupo completo de las 4 —
      // llegar ahí centrando cada una sola primero era lo que producía el
      // salto hacia atrás ("rebobinado") justo al final.
      const groupCenterUpTo = (i: number) => {
        let sum = 0;
        for (let k = 0; k <= i; k += 1) sum += centerOf(k);
        return sum / (i + 1);
      };
      const targetOf = (i: number) => containerWidth / 2 - groupCenterUpTo(i);

      const mergeThreshold = 0.08;
      const mergeT = Math.min(progress / mergeThreshold, 1);

      let trackTranslateX: number;
      let activeIndex: number;

      if (progress < mergeThreshold) {
        // Fase de apertura: el riel pasa de "pareja centrada" (0, el estado
        // ya aprobado) a "tarjeta 1 centrada sola" (targetOf(0)), en el mismo
        // tramo de scroll en que la apertura se funde detrás de ella.
        trackTranslateX = mergeT * targetOf(0);
        activeIndex = 0;
      } else {
        // Fase de carrusel: cada tarjeta pasa a estar centrada a su turno,
        // usando el resto del scroll para recorrer de la tarjeta 1 a la
        // última. La última llega a su lugar un poco antes del final
        // (arrivalFraction) y se queda quieta ese tramo final — si llegara
        // justo en el último pixel posible de scroll, alcanzar a verla
        // dependía de frenar el scroll exactamente en el límite, y con la
        // inercia normal del mouse/trackpad eso casi nunca pasa.
        const arrivalFraction = 0.85;
        const remapped = Math.min(
          (progress - mergeThreshold) / (1 - mergeThreshold) / arrivalFraction,
          1,
        );
        const ci = remapped * (items.length - 1);
        const i0 = Math.min(Math.floor(ci), items.length - 1);
        const i1 = Math.min(i0 + 1, items.length - 1);
        const frac = ci - i0;
        trackTranslateX = targetOf(i0) + frac * (targetOf(i1) - targetOf(i0));
        activeIndex = Math.min(items.length - 1, Math.round(ci));
      }

      track.style.transform = `translate3d(${trackTranslateX}px, 0, 0)`;

      // La apertura no viaja con el riel: converge hacia la posición exacta
      // de la tarjeta 1 (mismo x que `card1X + trackTranslateX`, ya vigente
      // en cualquiera de las dos fases de arriba) y queda con z-index menor,
      // así que desaparece tapada por la tarjeta activa en vez de deslizarse
      // a un lado.
      const openerX = pairLeft + mergeT * (card1X + trackTranslateX - pairLeft);
      opener.style.transform = `translate3d(${openerX}px, 0, 0)`;
      opener.style.opacity = String(1 - mergeT);

      if (activeIndex !== activeRef.current) {
        activeRef.current = activeIndex;
        setActive(activeIndex);
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    const onResize = () => {
      layout();
      onScroll();
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) update();
    });

    layout();
    observer.observe(section);
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [items]);

  return (
    <>
      <section
        ref={sectionRef}
        className="relative hidden bg-ink text-white motion-safe:md:block"
        style={{ height: `${Math.max(items.length * 85, 300)}vh` }}
      >
      <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-hidden">
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-white/10" />

          <div
            ref={containerRef}
            className="relative mx-auto h-full max-w-7xl px-8 pt-8 lg:px-12"
          >
            <div className="max-w-3xl">
              <h2 className="max-w-2xl text-5xl font-bold leading-[0.98] tracking-[-0.045em] text-white lg:text-6xl">
                Aprender haciendo,
                <span className="block text-white/50"> con un marco claro.</span>
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/65">
                Cuatro decisiones de producto: alcance chico, hitos visibles,
                colaboración real y barrera baja para empezar.
              </p>
            </div>

            <div className="absolute left-0 right-0 top-[34vh] z-10">
              <div
                ref={trackRef}
                className="flex w-max items-start gap-16 pl-[20vw] pr-[8vw] will-change-transform"
              >
                {items.map((item, index) => (
                  <PrincipleCard
                    key={item.titulo}
                    item={item}
                    index={index}
                    active={index === active}
                    revealed={index <= active}
                  />
                ))}
              </div>
            </div>

            {/* Apertura: al inicio queda a la izquierda de la tarjeta 1,
                formando con ella un par centrado en pantalla. Al primer
                scroll converge sobre la posición exacta de la tarjeta 1
                (mismo x, calculado en el JS) y con menor z-index — por eso
                desaparece tapada por la tarjeta activa en vez de deslizarse
                a un lado. Mismo lenguaje visual que las tarjetas, pero sin
                el borde "activa" y sin numerarla: es solo el punto de
                partida. */}
            <div
              ref={openerRef}
              aria-hidden
              className="pointer-events-none absolute left-0 top-[34vh] z-0 flex h-108 w-96 flex-col justify-center rounded-2xl border border-white/12 bg-[#163451] px-9 py-10 will-change-transform sm:w-100"
              style={{ marginTop: -34 }}
            >
              <h3 className="max-w-68 text-[2rem] font-semibold leading-none tracking-[-0.04em] text-white">
                Empiezas con un rol claro.
              </h3>
              <p className="mt-5 max-w-68 text-sm leading-relaxed text-white/62">
                Un microdesafío de 2 a 8 semanas, con rol, alcance y plazos
                definidos desde el inicio.
              </p>
            </div>

          </div>
        </div>
      </section>

      <MobilePrinciples items={items} />
    </>
  );
}

function PrincipleCard({
  item,
  index,
  active,
  revealed,
  compact = false,
}: {
  item: Principio;
  index: number;
  active: boolean;
  revealed: boolean;
  /** Móvil: ancho del viewport, sin desnivel exagerado. */
  compact?: boolean;
}) {
  // El desnivel intencional evita que parezca una grilla de tarjetas (solo desktop).
  const offsets = compact ? [0, 0, 0, 0] : [-34, 72, 0, 106];
  const tones = [
    "bg-[#163451] border-white/12",
    "bg-[#122F4B] border-white/12",
    "bg-[#193955] border-white/12",
    "bg-[#102B46] border-white/12",
  ];

  return (
    <article
      className={cn(
        "relative flex shrink-0 flex-col rounded-2xl border transition-[opacity,transform,filter,border-color,background-color] duration-700 ease-out",
        compact
          ? "h-80 w-[min(18.5rem,calc(100vw-2.75rem))] overflow-hidden px-5 py-6"
          : "h-108 w-96 overflow-hidden px-9 py-10 sm:w-100",
        !revealed
          ? "translate-x-14 translate-y-8 scale-95 border-transparent bg-transparent opacity-0 blur-[5px]"
          : active
            ? "border-electric/80 bg-[#1B3D5F]"
            : tones[index % tones.length],
      )}
      style={{ marginTop: offsets[index % offsets.length] }}
    >
      <div className="relative">
        <h3
          className={cn(
            "font-semibold leading-none tracking-[-0.04em] text-white",
            compact ? "max-w-none text-xl" : "max-w-68 text-[2rem]",
          )}
        >
          {item.titulo}
        </h3>
        <p
          className={cn(
            "leading-relaxed text-white/62",
            compact ? "mt-4 text-sm" : "mt-5 max-w-[18rem] text-sm",
          )}
        >
          {item.texto}
        </p>
      </div>

      <div className="relative mt-auto border-t border-white/10 pt-5">
        <p
          className={cn(
            "leading-relaxed text-white/50",
            compact ? "text-xs" : "max-w-[18rem] text-xs",
          )}
        >
          {item.practica}
        </p>
      </div>
    </article>
  );
}

/** Fallback accesible: sin pin ni animación; las tarjetas se recorren al deslizar. */
function MobilePrinciples({ items }: { items: Principio[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const update = () => {
      const cards = [...el.querySelectorAll<HTMLElement>("[data-principle-card]")];
      if (cards.length === 0) return;
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      cards.forEach((card, i) => {
        const center = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(center - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive(best);
      if (el.scrollLeft > 12) setHintVisible(false);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items.length]);

  return (
    <section className="block overflow-x-clip border-t border-white/12 bg-ink text-white motion-safe:md:hidden">
      <div className="px-6 pb-6 pt-12">
        <h2 className="text-[1.65rem] font-bold leading-tight tracking-tight sm:text-3xl">
          Aprender haciendo, con un marco claro.
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/65">
          Cuatro decisiones de producto: alcance chico, hitos visibles,
          colaboración real y barrera baja para empezar.
        </p>
      </div>

      <div className="relative">
        {/* Fade derecho: sugiere que hay más cards fuera de pantalla. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-ink to-transparent"
        />

        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-4 pe-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, index) => (
            <div
              key={item.titulo}
              data-principle-card
              className="snap-start"
            >
              <PrincipleCard
                item={item}
                index={index}
                active={index === active}
                revealed
                compact
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-6 pb-10 pt-1">
        <div
          className="flex items-center gap-1.5"
          role="tablist"
          aria-label="Principios"
        >
          {items.map((item, i) => (
            <button
              key={item.titulo}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Ver: ${item.titulo}`}
              onClick={() => {
                const el = scrollerRef.current;
                const card = el?.querySelectorAll<HTMLElement>(
                  "[data-principle-card]",
                )[i];
                card?.scrollIntoView({
                  behavior: "smooth",
                  inline: "start",
                  block: "nearest",
                });
                setHintVisible(false);
              }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === active
                  ? "w-5 bg-electric"
                  : "w-1.5 bg-white/25 hover:bg-white/45",
              )}
            />
          ))}
        </div>

        <p
          aria-hidden={!hintVisible}
          className={cn(
            "flex items-center gap-1 text-xs text-white/45 transition-opacity duration-300",
            hintVisible ? "opacity-100" : "opacity-0",
          )}
        >
          Desliza
          <span className="inline-block animate-pulse">›</span>
        </p>
      </div>
    </section>
  );
}
