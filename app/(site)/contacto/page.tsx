import type { Metadata } from "next";
import { LeadForm } from "@/features/leads/components/lead-form";
import { SiteFooter } from "@/components/site-footer";
import { RevealFooter } from "@/components/reveal-footer";

export const metadata: Metadata = {
  title: "Hablar con Vardelab · Para organizaciones",
  description:
    "Cuéntanos tu necesidad y vemos juntos si puede convertirse en un microproyecto acotado.",
  alternates: { canonical: "/contacto" },
};

const RAZONES = [
  "Conversamos antes de que publiques nada.",
  "No necesitas tener el desafío resuelto para conversar.",
  "No necesitas crear una cuenta todavía.",
];

/**
 * Contacto para organizaciones (Fase 1 · captación). Punto de entrada de
 * "Hablar con Vardelab": en el piloto se conversa antes de que la organización
 * publique nada. Registra un lead de tipo `contacto_organizacion`.
 *
 * Mismo criterio que `/proponer`: main blanco como el nav, sin bandeja exterior.
 */
export default function ContactoPage() {
  return (
    <>
      <main className="relative z-10 md:mb-(--footer-h,0px) min-h-[calc(100dvh-3.5rem)] flex-1 bg-white">
        <section className="mx-auto w-full max-w-5xl px-6 pt-16 pb-10 sm:pt-24 sm:pb-14">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-12">
            <div className="relative">
              <div
                className="pointer-events-none absolute -inset-8 -z-10 hidden lg:block"
                aria-hidden
              >
                <div className="animate-breathe absolute left-0 top-0 size-48 rounded-full bg-electric/20 blur-3xl" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-electric">
                Para organizaciones
              </span>
              <h1 className="mt-2.5 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Cuéntanos qué necesitas resolver
              </h1>
              <p className="mt-3 text-base text-muted sm:text-lg">
                Escríbenos tu necesidad y vemos juntos si puede convertirse en un
                microproyecto.
              </p>
              <ul className="mt-6 flex flex-col gap-2.5">
                {RAZONES.map((razon) => (
                  <li key={razon} className="flex items-center gap-2.5 text-sm">
                    <span
                      className="size-1.5 shrink-0 rounded-full bg-sprout"
                      aria-hidden
                    />
                    <span className="text-ink">{razon}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-[0_8px_28px_-12px_rgba(13,37,59,0.22)] sm:p-7">
              <LeadForm tipo="contacto_organizacion" />
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
