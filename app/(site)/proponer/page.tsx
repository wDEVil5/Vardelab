import type { Metadata } from "next";
import { LeadForm } from "@/features/leads/components/lead-form";
import { SiteFooter } from "@/components/site-footer";
import { RevealFooter } from "@/components/reveal-footer";

export const metadata: Metadata = {
  title: "Proponer un desafío · CampusLab",
  description:
    "¿Conoces una organización con una necesidad concreta? Ayúdanos a convertirla en un microproyecto.",
};

// Razones cortas para escribir, en vez de un párrafo único: dan textura a la
// columna izquierda y son más fáciles de leer en diagonal que un bloque de texto.
const RAZONES = [
  "Tú no tienes que resolverlo, solo contarnos.",
  "Nosotros contactamos a la organización.",
  "Ayudas a que más estudiantes tengan un desafío real.",
];

/**
 * Proponer un desafío (Fase 1 · captación). Cualquiera puede sugerir una
 * organización con una necesidad que podría volverse un microproyecto. Registra
 * un lead de tipo `propuesta_desafio`.
 */
export default function ProponerPage() {
  return (
    <>
      <main className="relative z-10 md:mb-(--footer-h,0px) min-h-[calc(100dvh-3.5rem)] flex-1 bg-surface">
        <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
            {/* Columna izquierda: el pitch. */}
            <div className="relative">
              <div
                className="pointer-events-none absolute -inset-8 -z-10 hidden lg:block"
                aria-hidden
              >
                <div className="animate-breathe absolute left-0 top-0 size-48 rounded-full bg-electric/20 blur-3xl" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-electric">
                Suma un proyecto
              </span>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                ¿Conoces una organización con un desafío?
              </h1>
              <p className="mt-4 text-lg text-muted">
                Cuéntanos de una organización con una necesidad concreta y vemos
                si calza con un microproyecto.
              </p>
              <ul className="mt-8 flex flex-col gap-3">
                {RAZONES.map((razon) => (
                  <li key={razon} className="flex items-center gap-2.5 text-sm">
                    <span className="size-1.5 shrink-0 rounded-full bg-sprout" aria-hidden />
                    <span className="text-ink">{razon}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Columna derecha: el formulario, en su propia tarjeta. */}
            <div className="rounded-3xl border border-border bg-white p-6 shadow-[0_4px_16px_-8px_rgba(13,37,59,0.12)] sm:p-8">
              <span className="text-xs font-semibold uppercase tracking-wide text-electric">
                Propuesta inicial
              </span>
              <div className="mt-4">
                <LeadForm tipo="propuesta_desafio" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <RevealFooter>
        <SiteFooter />
      </RevealFooter>
    </>
  );
}
