import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { RevealFooter } from "@/components/reveal-footer";

export const metadata: Metadata = {
  title: "Política de privacidad · Vardelab",
  description: "Borrador de política de privacidad de Vardelab.",
};

export default function PrivacidadPage() {
  return (
    <>
      <main className="relative z-10 flex-1 bg-white md:mb-(--footer-h,0px)">
        <article className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-wide text-electric">
            Versión piloto
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Política de privacidad
          </h1>
          <div className="mt-5 rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-muted">
            Esta política corresponde a la versión piloto de Vardelab y podrá
            actualizarse a medida que evolucione la plataforma.
          </div>
          <p className="mt-5 text-sm text-muted">Última actualización: 22 de septiembre de 2026.</p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted sm:text-base">
            <section>
              <h2 className="text-xl font-semibold text-ink">1. Qué información recopilamos</h2>
              <p className="mt-2">
                Podemos recopilar nombre, correo personal, carrera, semestre,
                habilidades, disponibilidad, enlaces de portafolio, información de
                organizaciones, proyectos, postulaciones, avances y mensajes
                relacionados con el funcionamiento de la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-ink">2. Para qué usamos la información</h2>
              <p className="mt-2">
                Usamos estos datos para crear cuentas, permitir postulaciones,
                formar equipos, gestionar proyectos, enviar avisos necesarios,
                moderar contenido, responder solicitudes y generar métricas
                agregadas del piloto. La mensajería entre estudiante y
                organización puede ser revisada por un moderador únicamente
                cuando existe un reporte asociado a esa conversación.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-ink">3. Qué puede hacerse público</h2>
              <p className="mt-2">
                La visibilidad depende de la configuración del perfil y de las
                reglas del producto. Un perfil público puede mostrar nombre,
                habilidades y evidencias que el estudiante haya decidido publicar.
                La información privada de autenticación no se muestra públicamente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-ink">4. Proveedores y seguridad</h2>
              <p className="mt-2">
                Vardelab utiliza servicios de infraestructura, base de datos,
                autenticación y correo transaccional para operar el piloto. El
                acceso se limita según el rol y se aplican controles de seguridad,
                auditoría y políticas de acceso. Nunca debes compartir contraseñas
                ni información sensible en un proyecto sin acordar antes cómo se
                protegerá.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-ink">5. Solicitudes sobre tus datos</h2>
              <p className="mt-2">
                Si necesitas corregir, revisar o solicitar la eliminación de tus
                datos, escríbenos mediante la página de <Link href="/contacto" className="text-electric hover:underline">contacto</Link>.
                Las solicitudes se revisarán según la etapa del piloto y las
                obligaciones aplicables.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-ink">6. Cookies</h2>
              <p className="mt-2">
                Este borrador no contempla cookies no esenciales, publicidad ni
                analítica de terceros. Si se incorporan en el futuro, esta política
                se actualizará y se informará su finalidad antes de utilizarlas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-ink">7. Actualizaciones</h2>
              <p className="mt-2">
                Esta política puede cambiar cuando se agreguen funciones, proveedores
                o nuevos flujos de datos. La versión vigente se publicará en esta
                página con su fecha de actualización.
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
