import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { RevealFooter } from "@/components/reveal-footer";

export const metadata: Metadata = {
  title: "Términos y condiciones · CampusLab",
  description: "Borrador de términos y condiciones de uso de CampusLab.",
};

export default function TerminosPage() {
  return (
    <>
      <main className="relative z-10 flex-1 bg-white md:mb-(--footer-h,0px)">
        <article className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-wide text-electric">
            Versión piloto
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Términos y condiciones
          </h1>
          <div className="mt-5 rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-muted">
            Estos términos corresponden a la versión piloto de CampusLab y podrán
            actualizarse a medida que evolucione la plataforma.
          </div>
          <p className="mt-5 text-sm text-muted">Última actualización: 17 de septiembre de 2026.</p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted sm:text-base">
            <section>
              <h2 className="text-xl font-semibold text-ink">1. Sobre CampusLab</h2>
              <p className="mt-2">
                CampusLab es una plataforma web que conecta estudiantes con
                organizaciones para desarrollar microproyectos reales, acotados y
                con un entregable verificable. La plataforma no es una bolsa de
                empleo, una agencia de contratación ni un aula virtual.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-ink">2. Cuentas y uso responsable</h2>
              <p className="mt-2">
                Cada persona debe entregar información verdadera, mantener segura
                su cuenta y usar la plataforma de forma respetuosa. No se permite
                suplantar identidades, publicar necesidades ficticias, compartir
                información sensible sin autorización ni utilizar CampusLab para
                reemplazar trabajo permanente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-ink">3. Microproyectos</h2>
              <p className="mt-2">
                Los proyectos deben tener una necesidad real, un alcance acotado,
                roles definidos, una persona responsable, un plazo razonable y un
                resultado que pueda revisarse. La publicación no garantiza que se
                forme un equipo ni que el entregable sea aceptado sin ajustes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-ink">4. Moderación y reportes</h2>
              <p className="mt-2">
                CampusLab puede revisar, rechazar, suspender o retirar contenido
                que incumpla estas reglas o ponga en riesgo a las personas. Los
                usuarios pueden reportar problemas mediante los canales disponibles
                en la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-ink">5. Responsabilidades</h2>
              <p className="mt-2">
                Estudiantes y organizaciones deben acordar el alcance, comunicar
                avances y cuidar la información compartida. CampusLab facilita el
                proceso y la trazabilidad, pero no reemplaza los acuerdos que las
                partes necesiten antes de comenzar.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-ink">6. Cambios y contacto</h2>
              <p className="mt-2">
                Estos términos pueden actualizarse a medida que avance el piloto.
                Para consultas sobre el uso de la plataforma, puedes escribirnos a
                través de la página de <Link href="/contacto" className="text-electric hover:underline">contacto</Link>.
              </p>
            </section>
          </div>
        </article>
      </main>
      <RevealFooter>
        <SiteFooter />
      </RevealFooter>
    </>
  );
}
