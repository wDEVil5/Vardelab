import type { Metadata } from "next";
import { LeadForm } from "@/features/leads/components/lead-form";
import { SiteFooter } from "@/components/site-footer";
import { RevealFooter } from "@/components/reveal-footer";

export const metadata: Metadata = {
  title: "Hablar con CampusLab · Para organizaciones",
  description:
    "Cuéntanos tu necesidad y vemos juntos si puede convertirse en un microproyecto acotado.",
};

/**
 * Contacto para organizaciones (Fase 1 · captación). Punto de entrada de
 * "Hablar con CampusLab": en el piloto se conversa antes de que la organización
 * publique nada. Registra un lead de tipo `contacto_organizacion`.
 */
export default function ContactoPage() {
  return (
    <>
      <main className="relative z-10 md:mb-(--footer-h,0px) min-h-[calc(100dvh-3.5rem)] flex-1 bg-white">
        <section className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-24">
          <span className="text-xs font-semibold uppercase tracking-wide text-electric">
            Para organizaciones
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Cuéntanos qué necesitas resolver
          </h1>
          <p className="mt-4 text-lg text-muted">
            Escríbenos tu necesidad y vemos juntos si puede convertirse en un
            microproyecto. En esta etapa piloto conversamos antes de que
            publiques nada: sin compromiso y sin crear una cuenta todavía.
          </p>

          <div className="mt-10">
            <LeadForm tipo="contacto_organizacion" />
          </div>
        </section>
      </main>

      <RevealFooter>
        <SiteFooter />
      </RevealFooter>
    </>
  );
}
