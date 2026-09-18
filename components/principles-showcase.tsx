"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export type PrincipleShowcaseItem = {
  titulo: string;
  texto: string;
  practica: string;
  icon?: string;
};

const PALETTES = [
  { background: "#183451", foreground: "#FFFFFF", muted: "rgba(255,255,255,0.62)", border: "rgba(255,255,255,0.16)" },
  { background: "#E8EEF4", foreground: "#0D253B", muted: "#607086", border: "#D4DEE8" },
  { background: "#E6F2EC", foreground: "#0D253B", muted: "#607086", border: "#CDE4D8" },
  { background: "#F4E9E5", foreground: "#0D253B", muted: "#607086", border: "#EAD5CE" },
];

function PrincipleMark({ index, color }: { index: number; color: string }) {
  const common = {
    fill: "none",
    stroke: color,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.5,
  };

  if (index === 1) {
    return (
      <svg viewBox="0 0 180 180" className="size-64 opacity-35 lg:size-72" aria-hidden>
        <path d="M30 45h120M30 90h120M30 135h120" {...common} opacity=".35" />
        <circle cx="42" cy="45" r="8" {...common} />
        <circle cx="90" cy="90" r="8" {...common} />
        <circle cx="138" cy="135" r="8" {...common} />
        <path d="M42 53c0 20 48 17 48 29s48 10 48 45" {...common} />
      </svg>
    );
  }

  if (index === 2) {
    return (
      <svg viewBox="0 0 180 180" className="size-64 opacity-35 lg:size-72" aria-hidden>
        <path d="M42 90h96M42 90l38-42M80 48l58 42M42 90l38 42M80 132l58-42" {...common} opacity=".65" />
        <circle cx="42" cy="90" r="14" {...common} />
        <circle cx="80" cy="48" r="10" {...common} />
        <circle cx="80" cy="132" r="10" {...common} />
        <circle cx="138" cy="90" r="14" {...common} />
      </svg>
    );
  }

  if (index === 3) {
    return (
      <svg viewBox="0 0 180 180" className="size-64 opacity-35 lg:size-72" aria-hidden>
        <path d="M48 145V52a12 12 0 0 1 12-12h60a12 12 0 0 1 12 12v93M48 145h84" {...common} />
        <path d="M75 95h58M113 75l20 20-20 20" {...common} />
        <circle cx="75" cy="95" r="4" fill={color} stroke="none" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 180 180" className="size-64 opacity-35 lg:size-72" aria-hidden>
      <circle cx="90" cy="90" r="58" {...common} opacity=".3" />
      <circle cx="90" cy="90" r="34" {...common} opacity=".55" />
      <circle cx="90" cy="90" r="10" fill={color} stroke="none" />
      <path d="M90 22v28M90 130v28M22 90h28M130 90h28" {...common} />
    </svg>
  );
}

/** Experiencia de principios basada en Scroll Expand. */
export function PrinciplesShowcase({
  items,
}: {
  items: PrincipleShowcaseItem[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    let frame = 0;
    const update = () => {
      const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
      const passed = Math.min(
        Math.max(-section.getBoundingClientRect().top, 0),
        travel,
      );
      const nextProgress = passed / travel;
      const expansion = Math.min(nextProgress / 0.28, 1);
      stage.style.width = `${58 + expansion * 42}%`;
      stage.style.height = `${58 + expansion * 22}%`;
      stage.style.borderRadius = `${40 - expansion * 12}px`;

      setProgress(nextProgress);
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, []);

  const activeIndex = Math.min(
    items.length - 1,
    Math.round(progress * (items.length - 1)),
  );
  const activeItem = items[activeIndex];
  const activePalette = PALETTES[activeIndex % PALETTES.length];

  return (
    <>
      <section
        ref={sectionRef}
        className="relative isolate hidden overflow-visible bg-cloud text-ink md:block"
        style={{ height: `${Math.max(items.length * 78, 300)}vh` }}
      >
        <div className="sticky top-14 flex h-[calc(100vh-3.5rem)] items-center overflow-hidden">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-8 py-12 lg:px-12">
            <div className="flex items-end justify-between gap-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-electric">
                  La experiencia CampusLab
                </p>
                <h2 className="mt-4 max-w-3xl text-4xl font-bold leading-[0.96] tracking-tighter lg:text-6xl">
                  Aprender haciendo,
                  <span className="block text-muted">con un marco claro.</span>
                </h2>
              </div>
              <p className="hidden max-w-xs pb-1 text-sm leading-relaxed text-muted lg:block">
                Cuatro decisiones que cuidan el tiempo del estudiante, de la
                organización y del resultado final.
              </p>
            </div>

            <div className="relative flex h-[min(62vh,38rem)] items-center justify-center">
              <div
                ref={stageRef}
                className="relative flex shrink-0 overflow-hidden border p-6 transition-[width,height,border-radius,background-color,border-color] duration-500 ease-out lg:p-9"
                style={{
                  width: "58%",
                  height: "58%",
                  borderRadius: 40,
                  backgroundColor: activePalette.background,
                  borderColor: activePalette.border,
                  color: activePalette.foreground,
                }}
                aria-live="polite"
              >
                <div className="flex w-full flex-col justify-between">
                  <div aria-hidden className="h-1" />
                  <div className="relative min-h-44 max-w-3xl lg:min-h-56">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={activeIndex}
                        className="absolute inset-x-0 top-0"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -18 }}
                        transition={{ duration: 0.38, ease: "easeOut" }}
                      >
                        <h3 className="max-w-2xl text-4xl font-semibold leading-[0.98] tracking-[-0.045em] lg:text-7xl" style={{ color: activePalette.foreground }}>
                          {activeItem.titulo}
                        </h3>
                        <p className="mt-6 max-w-xl text-base leading-relaxed lg:text-lg" style={{ color: activePalette.muted }}>
                          {activeItem.texto}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`mark-${activeIndex}`}
                      className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 lg:block"
                      initial={{ opacity: 0, scale: 0.86, rotate: -8 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 1.08, rotate: 8 }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                    >
                      <PrincipleMark index={activeIndex} color={activePalette.foreground} />
                    </motion.div>
                  </AnimatePresence>
                  <div className="flex items-end justify-between gap-8 border-t pt-5" style={{ borderColor: activePalette.border }}>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.p
                        key={`practice-${activeIndex}`}
                        className="max-w-xl flex-1 text-sm leading-relaxed"
                        style={{ color: activePalette.muted }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        {activeItem.practica}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted">
              <span>Desplázate para explorar</span>
              <div className="flex items-center gap-2" aria-label={`Principio ${activeIndex + 1} de ${items.length}`}>
                {items.map((item, index) => (
                  <span
                    key={item.titulo}
                    className={`h-1.5 rounded-full transition-all duration-300 ${index === activeIndex ? "w-10 bg-electric" : "w-1.5 bg-ink/15"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cloud px-5 py-14 text-ink md:hidden">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-electric">La experiencia CampusLab</p>
        <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.04em]">
          Aprender haciendo, <span className="text-muted">con un marco claro.</span>
        </h2>
        <div className="mt-8 space-y-3">
          {items.map((item, index) => (
            <article
              key={item.titulo}
              className="rounded-2xl border p-5"
              style={{
                backgroundColor: PALETTES[index % PALETTES.length].background,
                borderColor: PALETTES[index % PALETTES.length].border,
                color: PALETTES[index % PALETTES.length].foreground,
              }}
            >
              <h3 className="mt-10 text-3xl font-semibold leading-none tracking-[-0.04em]">{item.titulo}</h3>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: PALETTES[index % PALETTES.length].muted }}>{item.texto}</p>
              <p className="mt-8 border-t pt-4 text-xs leading-relaxed" style={{ borderColor: PALETTES[index % PALETTES.length].border, color: PALETTES[index % PALETTES.length].muted }}>{item.practica}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
