import type { Metadata } from "next";
import { LeadForm } from "@/features/leads/components/lead-form";
import { SiteFooter } from "@/components/site-footer";
import { RevealFooter } from "@/components/reveal-footer";

export const metadata: Metadata = {
  title: "Proponer un desafío · CampusLab",
  description:
    "¿Conoces una organización con una necesidad concreta? Ayúdanos a convertirla en un microproyecto.",
};

/**
 * Proponer un desafío (Fase 1 · captación). Cualquiera puede sugerir una
 * organización con una necesidad que podría volverse un microproyecto. Registra
 * un lead de tipo `propuesta_desafio`.
 */
export default function ProponerPage() {
  return (
    <>
      <main className="relative z-10 md:mb-(--footer-h,0px) min-h-[calc(100dvh-3.5rem)] flex-1 bg-white">
        <section className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-24">
          <span className="text-xs font-semibold uppercase tracking-wide text-electric">
            Suma un proyecto
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            ¿Conoces una organización con un desafío?
          </h1>
          <p className="mt-4 text-lg text-muted">
            Cuéntanos de una organización con una necesidad concreta. Nos ayudas
            a sumar proyectos reales para más estudiantes; nosotros nos
            encargamos de contactarla y ver si calza con un microproyecto.
          </p>

          <div className="mt-10">
            <LeadForm tipo="propuesta_desafio" />
          </div>
        </section>
      </main>

      <RevealFooter>
        <SiteFooter />
      </RevealFooter>
    </>
  );
}
