"use client";

import { type UIEvent, useEffect, useRef } from "react";

type IconName = "clock" | "result" | "shield" | "refresh" | "people";

type ConfidenceItem = {
  titulo: string;
  texto: string;
  icono: IconName;
};

function ConfidenceIcon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-7"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {name === "clock" && <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>}
      {name === "result" && <><path d="M5 4.5h10l4 4V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z" /><path d="M14 4.5V9h5M8 13h8M8 16h5" /></>}
      {name === "shield" && <><path d="M12 3.5 19 6v5.5c0 4.1-2.8 7.3-7 9-4.2-1.7-7-4.9-7-9V6l7-2.5Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>}
      {name === "refresh" && <><path d="M19 8a7.5 7.5 0 0 0-13.2-1.7L4 8.5" /><path d="M4 4.5v4h4" /><path d="M5 16a7.5 7.5 0 0 0 13.2 1.7l1.8-2.2" /><path d="M20 19.5v-4h-4" /></>}
      {name === "people" && <><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.8-3.2 2.7-5 5.5-5s4.7 1.8 5.5 5" /><path d="M15.5 5.5a3 3 0 0 1 0 5.5M17 14c1.8.7 3 2.2 3.5 4.5" /></>}
    </svg>
  );
}

export function ConfidenceCarousel({ items }: { items: ConfidenceItem[] }) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const carousel = carouselRef.current;
    const track = trackRef.current;
    const firstGroup = track?.children[0] as HTMLElement | undefined;
    const secondGroup = track?.children[1] as HTMLElement | undefined;

    if (!carousel || !firstGroup || !secondGroup) return;

    const cycleWidth = secondGroup.offsetLeft - firstGroup.offsetLeft;
    if (cycleWidth > 0 && window.matchMedia("(hover: none)").matches) {
      carousel.scrollLeft = cycleWidth;
    }
  }, [items.length]);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const track = trackRef.current;
    const firstGroup = track?.children[0] as HTMLElement | undefined;
    const secondGroup = track?.children[1] as HTMLElement | undefined;

    if (!firstGroup || !secondGroup) return;

    const cycleWidth = secondGroup.offsetLeft - firstGroup.offsetLeft;
    if (cycleWidth <= 0) return;

    if (event.currentTarget.scrollLeft >= cycleWidth) {
      event.currentTarget.scrollLeft -= cycleWidth;
    } else if (event.currentTarget.scrollLeft <= 0) {
      event.currentTarget.scrollLeft += cycleWidth;
    }
  }

  return (
    <div className="confidence-carousel-shell">
      <div
      className="confidence-carousel relative -mx-5 overflow-x-auto overflow-y-hidden px-5 touch-pan-x sm:-mx-6 sm:px-6"
      ref={carouselRef}
      onScroll={handleScroll}
      >
        <div className="confidence-carousel__fade confidence-carousel__fade--left" aria-hidden />
        <div className="confidence-carousel__fade confidence-carousel__fade--right" aria-hidden />
        <div ref={trackRef} className="confidence-carousel__track flex w-max gap-4 py-3 pl-4 pr-4">
          {[items, items].map((grupo, grupoIndex) => (
            <div key={grupoIndex} className="flex shrink-0 gap-4" aria-hidden={grupoIndex === 1}>
              {grupo.map((item) => (
                <article
                  key={`${grupoIndex}-${item.titulo}`}
                  tabIndex={0}
                  className="confidence-carousel__card group relative h-64 w-[calc(100vw-3rem)] max-w-[22rem] shrink-0 outline-none sm:w-[22rem]"
                >
                  <div className="absolute inset-0 overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-[0_12px_28px_-22px_rgba(13,37,59,0.45)] transition-[border-color,box-shadow] duration-300 group-hover:border-electric/35 group-hover:shadow-[0_18px_34px_-20px_rgba(56,103,255,0.28)] group-focus-visible:border-electric/45 group-focus-visible:ring-2 group-focus-visible:ring-electric/20 sm:p-7">
                    <div className="confidence-carousel__card-content absolute inset-x-6 top-1/2 -translate-y-1/2 sm:inset-x-7">
                      <h3 className="text-xl font-semibold leading-tight tracking-tight text-ink sm:text-[1.35rem]">{item.titulo}</h3>
                      <p className="confidence-carousel__copy mt-3 max-w-sm text-sm leading-relaxed text-muted">{item.texto}</p>
                    </div>
                  </div>
                  <span className="confidence-carousel__icon absolute top-5 left-6 z-10 flex size-12 items-center justify-center rounded-xl border border-white/80 bg-white/75 text-electric shadow-[0_12px_24px_-12px_rgba(13,37,59,0.55)] backdrop-blur-md group-hover:bg-electric/10 group-focus-visible:bg-electric/10 sm:left-7">
                    <ConfidenceIcon name={item.icono} />
                  </span>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="confidence-carousel__indicator md:hidden" aria-label="Desliza para ver más preguntas">
        <span className="confidence-carousel__indicator-arrow" aria-hidden>←</span>
        <span className="confidence-carousel__dots" aria-hidden>
          {items.map((item) => <span key={item.titulo} />)}
        </span>
        <span className="confidence-carousel__indicator-arrow" aria-hidden>→</span>
      </div>
    </div>
  );
}
