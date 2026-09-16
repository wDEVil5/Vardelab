"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { TiltedProjectCard } from "@/features/projects/components/tilted-project-card";
import type { ProjectCard as ProjectCardData } from "@/features/projects/queries";

/** Intervalo calmado del hero (más lento que /organizaciones). */
const INTERVALO_MS = 6500;

/**
 * Ancla del hero de la landing: rota entre pocos proyectos reales con cupo
 * abierto, con tilt 3D. Solo desde md (el padre la oculta en móvil: la ficha
 * rotativa satura el primer pantallazo). Sin controles. Pausa si el puntero
 * (o el foco) está encima. Si hay un solo proyecto o reduced-motion, no rota.
 */
export function HeroOpenProjects({
  projects,
}: {
  projects: ProjectCardData[];
}) {
  const reduceMotion = useReducedMotion();
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const pausadoRef = useRef(false);

  const actual = projects[indice] ?? projects[0];

  useEffect(() => {
    pausadoRef.current = pausado;
  }, [pausado]);

  useEffect(() => {
    if (reduceMotion || projects.length < 2) return;
    const id = window.setInterval(() => {
      if (pausadoRef.current) return;
      setIndice((i) => (i + 1) % projects.length);
    }, INTERVALO_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, projects.length]);

  if (!actual) return null;

  const pauseHandlers = {
    onPointerEnter: () => setPausado(true),
    onPointerLeave: () => setPausado(false),
    onFocusCapture: () => setPausado(true),
    onBlurCapture: (e: React.FocusEvent<HTMLDivElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
        setPausado(false);
      }
    },
  };

  return (
    <div
      className="animate-rise"
      style={{ animationDelay: "150ms" }}
      aria-live="polite"
      {...pauseHandlers}
    >
      <TiltedProjectCard project={actual} />

      {projects.length > 1 ? (
        <div
          className="mt-2 flex items-center justify-center gap-1.5"
          aria-hidden
        >
          {projects.map((p, i) => (
            <span
              key={p.id}
              className={
                i === indice
                  ? "h-1.5 w-4 rounded-full bg-electric"
                  : "size-1.5 rounded-full bg-border"
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
