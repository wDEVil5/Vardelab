"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { OrganizacionHeroVisual } from "@/components/organizacion-hero-visual";
import { AuthOpenProjects } from "@/features/auth/components/auth-open-projects";
import type { Rol } from "@/features/auth/components/signup-form";
import type { ProjectCard as ProjectCardData } from "@/features/projects/queries";

type AuthBrandPanelProps = {
  title: ReactNode;
  description: string;
  /** Quién mira el panel: estudiante → proyectos; patrocinador → visual org. */
  audience?: Rol;
  /** Clave de cruce (ruta/rol). Si no va, usa audience. */
  contentKey?: string;
  projects?: ProjectCardData[];
};

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Columna izquierda (desktop): marca, copy y peek según audiencia.
 * Al cambiar ruta o rol, título + peek cruzan solo con opacidad (sin blur),
 * sin desplazar el layout. Estudiante: Tilted Cards. Patrocinador: visual
 * de /organizaciones.
 */
export function AuthBrandPanel({
  title,
  description,
  audience = "estudiante",
  contentKey,
  projects = [],
}: AuthBrandPanelProps) {
  const reduceMotion = useReducedMotion();
  const key = contentKey ?? audience;

  return (
    <aside className="relative hidden min-h-screen flex-1 flex-col overflow-hidden px-10 py-10 text-white lg:flex xl:px-14 xl:py-12">
      <Link
        href="/"
        className="relative z-10 text-[15px] font-semibold tracking-tight text-white"
      >
        CampusLab
      </Link>

      <div className="relative z-10 mt-14 flex max-w-md flex-1 flex-col xl:mt-16 xl:max-w-120">
        <div className="relative min-h-30">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`copy-${key}`}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE }}
            >
              <h1 className="text-[2.25rem] leading-[1.12] font-bold tracking-tight text-white xl:text-[2.5rem]">
                {title}
              </h1>
              <p className="mt-3.5 max-w-104 text-[15px] leading-[1.55] text-white/60">
                {description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative mt-8 min-h-104 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`peek-${audience}`}
              className="absolute inset-x-0 top-0 w-full"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.24, ease: EASE }}
            >
              {audience === "patrocinador" ? (
                <div className="flex flex-col">
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-white">
                      De una necesidad a un microproyecto
                    </p>
                    <p className="mt-0.5 text-xs text-white/45">
                      Ejemplos con alcance, plazo y entregable
                    </p>
                  </div>
                  <div className="origin-top scale-[0.92] sm:scale-95">
                    <OrganizacionHeroVisual />
                  </div>
                  <div className="mt-5 flex justify-center">
                    <Link
                      href="/organizaciones"
                      className="group inline-flex items-center rounded-lg bg-electric px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-electric/90"
                    >
                      Cómo funciona
                      <span
                        aria-hidden
                        className="ml-0.5 inline-block transition-transform group-hover:translate-x-0.5"
                      >
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              ) : projects.length > 0 ? (
                <AuthOpenProjects projects={projects} />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-auto pt-10 text-[11px] leading-relaxed text-white/30">
          Piloto independiente · sin patrocinio institucional
        </p>
      </div>

      <div
        className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full bg-electric/12 blur-3xl"
        aria-hidden
      />
    </aside>
  );
}
