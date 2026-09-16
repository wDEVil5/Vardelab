"use client";

import { useRef } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { ProjectCard } from "@/features/projects/components/project-card";
import type { ProjectCard as ProjectCardData } from "@/features/projects/queries";
import { cn } from "@/lib/utils";

const SPRING = { damping: 28, stiffness: 130, mass: 1.1 } as const;

/**
 * Adaptación del Tilted Card de React Bits: tilt 3D con spring y contenido
 * real del catálogo. `compact` reduce tamaño para paneles estrechos (auth) y
 * Fija la altura del marco (compact y hero) para que la rotación no salte
 * entre proyectos.
 * Transición fade+blur (Fade Content). Respeta prefers-reduced-motion.
 */
export function TiltedProjectCard({
  project,
  compact = false,
}: {
  project: ProjectCardData;
  compact?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const rotateX = useSpring(useMotionValue(0), SPRING);
  const rotateY = useSpring(useMotionValue(0), SPRING);
  const scale = useSpring(1, SPRING);

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    if (reduceMotion || event.pointerType === "touch" || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const amp = compact ? 8 : 12;

    rotateX.set(y * -amp);
    rotateY.set(x * amp);
  }

  function handlePointerEnter(event: React.PointerEvent<HTMLElement>) {
    if (reduceMotion || event.pointerType === "touch") return;
    scale.set(compact ? 1.015 : 1.025);
  }

  function reset() {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  }

  return (
    <figure
      ref={ref}
      className={cn(
        "relative mx-auto flex w-full items-center justify-center [perspective:1000px]",
        compact ? "h-[22.5rem] max-w-md" : "h-[28rem] max-w-lg",
      )}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={reset}
      onPointerCancel={reset}
    >
      <div
        aria-hidden
        className={cn(
          "absolute rounded-3xl bg-electric/12 blur-[1px]",
          compact
            ? "inset-x-8 top-10 h-[78%] rotate-5"
            : "inset-x-10 top-12 h-[78%] rotate-6",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "absolute rounded-3xl bg-sprout/18 blur-[1px]",
          compact
            ? "inset-x-10 top-12 h-[78%] -rotate-4"
            : "inset-x-12 top-14 h-[78%] -rotate-5",
        )}
      />

      <motion.div
        className={cn(
          "relative z-10 will-change-transform [transform-style:preserve-3d]",
          compact
            ? "h-[18.75rem] w-[min(100%,22rem)]"
            : "h-[23.5rem] w-[min(100%,26rem)]",
        )}
        style={{ rotateX, rotateY, scale }}
      >
        <div
          className={cn(
            "flex h-full flex-col rounded-3xl bg-white p-2 shadow-[0_28px_70px_-28px_rgba(13,37,59,0.48)] [transform:translateZ(0)]",
            compact && "p-1.5 shadow-[0_20px_50px_-24px_rgba(13,37,59,0.55)]",
          )}
        >
          <div
            className="min-h-0 flex-1 overflow-hidden rounded-[1.15rem] [transform:translateZ(24px)]"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={project.id}
                className="h-full"
                initial={
                  reduceMotion ? false : { opacity: 0, filter: "blur(8px)" }
                }
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={
                  reduceMotion
                    ? undefined
                    : { opacity: 0, filter: "blur(8px)" }
                }
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <ProjectCard
                  project={project}
                  variant="hero"
                  compact={compact}
                  className="h-full"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <figcaption
          className={cn(
            "pointer-events-none absolute rounded-full border border-border bg-white font-medium text-ink shadow-md [transform:translateZ(42px)]",
            compact
              ? "-right-2 -bottom-3 px-2.5 py-1.5 text-xs"
              : "-right-4 -bottom-4 px-3.5 py-2 text-sm",
          )}
        >
          Cupo abierto
        </figcaption>
      </motion.div>
    </figure>
  );
}
