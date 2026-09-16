"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { TiltedProjectCard } from "@/features/projects/components/tilted-project-card";
import type { ProjectCard as ProjectCardData } from "@/features/projects/queries";

/** Mismo ritmo calmado que el hero de la landing. */
const INTERVALO_MS = 6500;

/**
 * Peek de proyectos abiertos en el panel de marca de auth: reusa la
 * TiltedProjectCard del hero (compacta), con rotación y pausa al hover/foco.
 */
export function AuthOpenProjects({
  projects,
}: {
  projects: ProjectCardData[];
}) {
  const reduceMotion = useReducedMotion();
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const pausadoRef = useRef(false);

  const peek = projects.slice(0, 3);
  const actual = peek[indice] ?? peek[0];

  useEffect(() => {
    pausadoRef.current = pausado;
  }, [pausado]);

  useEffect(() => {
    if (reduceMotion || peek.length < 2) return;
    const id = window.setInterval(() => {
      if (pausadoRef.current) return;
      setIndice((i) => (i + 1) % peek.length);
    }, INTERVALO_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, peek.length]);

  if (!actual) return null;

  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <p className="text-sm font-semibold text-white">Proyectos abiertos</p>
        <p className="mt-0.5 text-xs text-white/45">Del catálogo público</p>
      </div>

      <div
        className="relative"
        aria-live="polite"
        onPointerEnter={() => setPausado(true)}
        onPointerLeave={() => setPausado(false)}
        onFocusCapture={() => setPausado(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setPausado(false);
          }
        }}
      >
        <TiltedProjectCard project={actual} compact />

        {peek.length > 1 ? (
          <div
            className="mt-4 flex items-center justify-center gap-1.5"
            aria-hidden
          >
            {peek.map((p, i) => (
              <span
                key={p.id}
                className={
                  i === indice
                    ? "h-1.5 w-4 rounded-full bg-electric"
                    : "size-1.5 rounded-full bg-white/25"
                }
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex justify-center">
        <Link
          href="/proyectos"
          className="group inline-flex items-center rounded-lg bg-electric px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-electric/90"
        >
          Ver catálogo
          <span
            aria-hidden
            className="ml-0.5 inline-block transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
