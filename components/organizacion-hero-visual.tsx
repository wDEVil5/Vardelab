"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { OrganizacionHeroGrafico } from "@/components/organizacion-hero-grafico";
import {
  HERO_NECESIDAD_INTERVALO_MS,
  NECESIDADES_HERO,
} from "@/features/organizations/necesidades-ejemplo";

/**
 * Visual del hero en /organizaciones: composición pasiva (solo se mira).
 *
 * Los ejemplos vienen de `features/organizations/necesidades-ejemplo.ts`
 * (`NECESIDADES_HERO`). Para agregar o editar uno, editá ese catálogo —
 * no hace falta tocar este archivo salvo cambios de layout/estilo.
 */
export function OrganizacionHeroVisual() {
  const reduceMotion = useReducedMotion();
  const [indice, setIndice] = useState(0);
  const actual = NECESIDADES_HERO[indice]!;

  useEffect(() => {
    if (reduceMotion || NECESIDADES_HERO.length < 2) return;
    const id = window.setInterval(() => {
      setIndice((i) => (i + 1) % NECESIDADES_HERO.length);
    }, HERO_NECESIDAD_INTERVALO_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <div
      className="relative mx-auto mb-4 min-h-128 w-full max-w-lg lg:mb-10"
      role="img"
      aria-label="Ejemplos de necesidades concretas que se convierten en microproyectos con alcance, plazo y entregable."
    >
      <div className="pointer-events-none absolute -inset-x-6 top-6 -bottom-6 -z-10 overflow-visible" aria-hidden>
        <div className="animate-breathe absolute top-8 -right-6 size-72 rounded-[42%_58%_48%_52%] bg-electric/35 blur-3xl sm:size-80" />
        <div
          className="animate-breathe absolute -bottom-2 -left-8 size-64 rounded-[58%_42%_55%_45%] bg-sprout/35 blur-3xl sm:size-72"
          style={{ animationDelay: "-3s" }}
        />
        <div className="absolute top-16 right-0 size-64 rounded-[46%_54%_42%_58%/52%_44%_56%_48%] bg-electric/22 blur-2xl sm:size-72" />
        <div className="absolute bottom-16 left-8 size-48 rounded-[50%_50%_45%_55%] bg-sprout/18 blur-2xl" />
        <div className="absolute top-1/3 left-1/2 size-56 -translate-x-1/2 rounded-[48%_52%_50%_50%] bg-electric/15 blur-3xl" />
      </div>

      <div className="animate-float-soft absolute top-0 left-0 z-20 rounded-2xl border border-border bg-white px-3.5 py-2.5 shadow-[0_12px_30px_-16px_rgba(13,37,59,0.35)]">
        <p className="text-xs font-semibold text-electric">Alcance claro</p>
        <p className="text-xs text-muted">Qué se entrega y qué no</p>
      </div>

      <div className="animate-float-soft-delayed absolute top-16 -right-1 z-20 rounded-2xl border border-border bg-white px-3.5 py-2.5 shadow-[0_12px_30px_-16px_rgba(13,37,59,0.35)] sm:right-0">
        <p className="text-xs font-semibold text-sprout">Estudiantes listos</p>
        <p className="text-xs text-muted">Equipo con roles cubiertos</p>
      </div>

      <div className="absolute inset-x-3 top-14 z-10 sm:inset-x-6">
        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_24px_50px_-24px_rgba(13,37,59,0.4)]">
          <div className="relative h-44 overflow-hidden bg-linear-to-br from-electric via-electric to-deep px-6 pt-5">
            <span className="relative z-10 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold tracking-wide text-electric uppercase shadow-sm">
              Tu necesidad
            </span>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={actual.id}
                className="pointer-events-none absolute inset-0 z-0"
                aria-hidden
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
              >
                <OrganizacionHeroGrafico tipo={actual.grafico} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="space-y-5 p-6">
            <div className="min-h-13" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.h3
                  key={actual.id}
                  className="text-lg leading-snug font-bold text-ink sm:text-xl"
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  {actual.titulo}
                </motion.h3>
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={actual.id}
                className="flex flex-wrap gap-2"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink">
                  {actual.plazo}
                </span>
                <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink">
                  {actual.modalidad}
                </span>
              </motion.div>
            </AnimatePresence>

            <div
              className="flex items-center gap-2 rounded-2xl border border-border bg-surface/80 px-3.5 py-3"
              aria-label="De la necesidad a la entrega"
            >
              <span className="text-xs font-semibold text-electric">Necesidad</span>
              <span
                aria-hidden
                className="h-0.5 flex-1 rounded-full bg-linear-to-r from-electric/50 to-sprout/50"
              />
              <span className="text-xs font-semibold text-sprout">Entrega</span>
            </div>

            <div className="flex items-center justify-center gap-1.5" aria-hidden>
              {NECESIDADES_HERO.map((n, i) => (
                <span
                  key={n.id}
                  className={
                    i === indice
                      ? "h-1.5 w-4 rounded-full bg-electric"
                      : "size-1.5 rounded-full bg-border"
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="animate-float-soft-slow absolute -bottom-1 left-5 z-20 rounded-2xl border border-border bg-white px-3.5 py-2.5 shadow-[0_12px_30px_-16px_rgba(13,37,59,0.35)]">
        <p className="text-xs font-semibold text-ink">Seguimiento visible</p>
        <p className="text-xs text-muted">Hitos claros de principio a fin</p>
      </div>
    </div>
  );
}
