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

/** Tarjetas escalonadas con `sticky` nativo. Sin filtros ni escala por scroll
 * para evitar re-composición y vibración del texto en Safari. */
export function ProcessStack({ titulo, pasos }: { titulo: string; pasos: ProcesoPaso[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let hideAt = 0;
    let hidden: boolean | null = null;

    const update = () => {
      const nextHidden = window.scrollY >= hideAt;
      if (hidden === nextHidden || !titleRef.current) return;
      hidden = nextHidden;
      titleRef.current.style.opacity = nextHidden ? "0" : "1";
    };

    const measure = () => {
      const container = containerRef.current;
      const firstCard = container?.querySelector<HTMLElement>(".process-stack-card");
      if (!container || !firstCard) return;
      hideAt = container.getBoundingClientRect().top + window.scrollY + firstCard.offsetTop - TOP_BASE;
      update();
    };

    measure();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <h2
        ref={titleRef}
        className="sticky top-18 z-0 mb-8 text-center text-2xl font-bold tracking-tight text-ink sm:mb-10 sm:text-3xl"
      >
        {titulo}
      </h2>
      {pasos.map((paso, i) => {
        const color = COLORES[i % COLORES.length];
        return (
          <div
            key={paso.titulo}
            className="process-stack-card sticky mb-5 last:mb-0"
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
