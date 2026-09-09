"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Visual del hero con propósito: tres formas orgánicas que representan las partes
 * del modelo —Estudiantes, Organizaciones y Proyectos— y se superponen (mezcla de
 * color) en el punto donde se encuentran. Interactivo: las formas siguen el cursor
 * con un leve parallax por profundidad, y al pasar el mouse se resalta su etiqueta.
 * Se desactiva el parallax con `prefers-reduced-motion`.
 */
type Forma = {
  label: string;
  color: string;
  size: string;
  pos: string;
  radius: string;
  depth: number; // factor de parallax (mayor = se mueve más)
  breathe?: boolean;
};

const FORMAS: Forma[] = [
  {
    label: "Estudiantes",
    color: "bg-electric/30",
    size: "size-56",
    pos: "left-[8%] top-[4%]",
    radius: "46% 54% 58% 42% / 44% 46% 54% 56%",
    depth: 1,
    breathe: true,
  },
  {
    label: "Organizaciones",
    color: "bg-sprout/30",
    size: "size-60",
    pos: "right-[6%] top-[22%]",
    radius: "56% 44% 47% 53% / 52% 58% 42% 48%",
    depth: 0.6,
  },
  {
    label: "Proyectos",
    color: "bg-coral/25",
    size: "size-44",
    pos: "bottom-[6%] left-[30%]",
    radius: "50% 50% 44% 56% / 52% 44% 56% 48%",
    depth: 1.4,
  },
];

const MAX_DESPLAZAMIENTO = 20; // px que se mueve la forma más "cercana"

export function HeroShapes() {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const formaRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef(0);

  useEffect(() => {
    const el = contenedorRef.current;
    if (!el) return;
    // Sin parallax si el usuario prefiere menos movimiento.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      // Posición del cursor normalizada al centro del contenedor: [-1, 1].
      const nx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const ny = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        formaRefs.current.forEach((s, i) => {
          if (!s) return;
          const d = FORMAS[i].depth * MAX_DESPLAZAMIENTO;
          s.style.transform = `translate(${(nx * d).toFixed(1)}px, ${(ny * d).toFixed(1)}px)`;
        });
      });
    };
    const reset = () => {
      cancelAnimationFrame(rafRef.current);
      formaRefs.current.forEach((s) => {
        if (s) s.style.transform = "translate(0px, 0px)";
      });
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
    return () => {
      cancelAnimationFrame(rafRef.current);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
    };
  }, []);

  return (
    <div
      ref={contenedorRef}
      role="img"
      aria-label="Estudiantes y organizaciones se encuentran en proyectos reales."
      className="relative min-h-85"
    >
      {FORMAS.map((f, i) => (
        <div
          key={f.label}
          ref={(el) => {
            formaRefs.current[i] = el;
          }}
          className={cn(
            "group absolute transition-transform duration-200 ease-out hover:z-10",
            f.pos,
          )}
        >
          <div className="relative">
            <div
              aria-hidden
              className={cn(
                f.size,
                f.color,
                "mix-blend-multiply transition-opacity duration-300 group-hover:opacity-90",
                f.breathe && "animate-breathe",
              )}
              style={{ borderRadius: f.radius }}
            />
            {/* Etiqueta = propósito de la forma. */}
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-white/85 px-2.5 py-1 text-xs font-medium text-ink shadow-sm transition-colors duration-300 group-hover:bg-white group-hover:text-electric">
                {f.label}
              </span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
