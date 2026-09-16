import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/reveal";
import { FadeContent } from "@/components/fade-content";
import { GlowCard } from "@/components/glow-card";
import { Faq } from "@/components/faq";
import { SiteFooter } from "@/components/site-footer";
import { RevealFooter } from "@/components/reveal-footer";
import { DesafiosExplorer } from "@/components/desafios-explorer";
import { ProcessStack, type ProcesoPaso } from "@/components/process-stack";
import { OrganizacionHeroVisual } from "@/components/organizacion-hero-visual";
import { EJEMPLOS_ORGANIZACION } from "@/features/organizations/necesidades-ejemplo";

export const metadata: Metadata = {
  title: "Para organizaciones · CampusLab",
  description:
    "Convierte una necesidad concreta en un microproyecto con alcance definido, estudiantes interesados y seguimiento visible de principio a fin.",
  openGraph: {
    title: "Para organizaciones · CampusLab",
    description:
      "Convierte una necesidad concreta en un microproyecto con alcance definido, estudiantes interesados y seguimiento visible de principio a fin.",
  },
};

/**
 * P-05 · Para organizaciones. Landing pública para captar organizaciones, pymes,
 * emprendimientos, fundaciones e instituciones. Server Component (contenido
 * estático), sobre los tokens de Foundations. Piloto independiente: sin métricas,
 * logos, testimonios ni casos ficticios. No es un panel autenticado.
 */
export default function OrganizacionesPage() {
  return (
    <>
      <main className="relative z-10 min-h-[calc(100dvh-3.5rem)] flex-1 overflow-x-clip bg-white md:mb-(--footer-h,0px) md:shadow-[0_8px_24px_-16px_rgba(13,37,59,0.12)]">
        {/* 1 · HERO */}
        <section className="mx-auto w-full max-w-6xl overflow-x-clip px-5 py-8 sm:px-6 sm:py-24 lg:pb-32">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-10 lg:gap-12">
            <div className="flex animate-rise flex-col items-start gap-5 sm:gap-7">
              <span className="text-xs font-semibold uppercase tracking-wide text-electric sm:text-sm">
                Para organizaciones
              </span>
              <h1 className="text-[1.85rem] font-bold leading-[1.15] tracking-tight text-ink sm:text-4xl sm:leading-tight md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                Ese proyecto pendiente puede empezar a avanzar.
              </h1>
              <p className="max-w-lg text-base text-muted sm:text-lg sm:leading-relaxed md:text-xl">
                Convierte una necesidad concreta en un microproyecto con alcance
                definido, estudiantes interesados y seguimiento visible de
                principio a fin.
              </p>
              <div className="flex w-full flex-col items-start gap-4">
                <Link
                  href="/contacto"
                  className={cn(
                    buttonClasses({ variant: "primary" }),
                    "h-12 justify-center px-7 text-base sm:text-lg",
                  )}
                >
                  Cuéntanos qué necesitas resolver
                </Link>
                <Link
                  href="/proyectos"
                  className="group inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-electric"
                >
                  Ver ejemplos de desafíos
                  <span className="transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>
              </div>
            </div>

            {/* Composición pasiva: ficha de desafío + chips flotantes.
                Inspirada en firstjob.me (capa central + flotantes), adaptada
                a CampusLab. Si no convence, volver a TransformacionHero. */}
            <div className="animate-rise hidden md:block" style={{ animationDelay: "150ms" }}>
              <OrganizacionHeroVisual />
            </div>
            {/* Mobile: la composición flotante pierde legibilidad; se mantiene
                la transformación en bloques, más clara en columna. */}
            <div className="md:hidden">
              <TransformacionHero />
            </div>
          </div>
        </section>

        {/* 2 · PROPUESTA DE VALOR — GlowCard + Fade Content (React Bits, sin cursor) */}
        <section className="bg-surface">
          <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-6 sm:py-16">
            <FadeContent>
              <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                De una necesidad difusa a un microproyecto claro.
              </h2>
              <p className="mt-3 max-w-xl text-muted">
                Para{" "}
                <strong className="font-semibold text-ink">organizaciones</strong>,{" "}
                <strong className="font-semibold text-ink">pymes</strong>,{" "}
                <strong className="font-semibold text-ink">fundaciones</strong> e{" "}
                <strong className="font-semibold text-ink">instituciones</strong>{" "}
                con retos acotados que necesitan una primera solución o una
                entrega concreta.
              </p>
            </FadeContent>
            <div className="mt-10 grid gap-4 md:grid-cols-3 md:items-stretch">
              {PROPUESTA.map((item, i) => {
                // La del medio es el diferenciador real: el seguimiento durante
                // el proceso, no solo "define bien" o "recibe algo útil".
                const destacada = i === 1;
                return (
                  <FadeContent
                    key={item.titulo}
                    delay={0.06 * i}
                    className="h-full"
                  >
                    <GlowCard featured={destacada}>
                      {destacada ? (
                        <span className="w-fit rounded-full bg-electric/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-electric uppercase">
                          Diferenciador
                        </span>
                      ) : (
                        <span className="text-xs font-semibold tabular-nums text-muted">
                          0{i + 1}
                        </span>
                      )}
                      <h3 className="text-lg font-semibold text-ink">{item.titulo}</h3>
                      <p className="text-sm leading-relaxed text-muted">
                        {item.texto}
                      </p>
                    </GlowCard>
                  </FadeContent>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3 · QUÉ TIPO DE DESAFÍOS FUNCIONAN */}
        <section className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-6 sm:py-20">
          <Reveal>
            <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Los mejores desafíos son concretos y alcanzables.
            </h2>
            <p className="mt-3 max-w-2xl text-muted">
              Basta con una necesidad clara: objetivo, duración (2–8 semanas) y
              entregable definidos. El equipo suele ser de 1 a 5 estudiantes.
            </p>
          </Reveal>

          <Reveal delayMs={80}>
            <p className="mt-10 max-w-2xl text-sm font-medium leading-relaxed text-ink">
              Si tu necesidad se parece a alguno de estos ejemplos, probablemente
              puede convertirse en un microproyecto.
            </p>
            <div className="mt-4">
              <DesafiosExplorer items={[...EJEMPLOS_ORGANIZACION]} />
            </div>
          </Reveal>

          {/* Bloque honesto y destacado (rompe el patrón claro con tono serio). */}
          <Reveal>
            <div className="mt-8 rounded-2xl bg-ink px-6 py-8 text-white sm:px-10">
              <p className="max-w-3xl text-lg leading-relaxed">
                CampusLab no reemplaza un puesto de trabajo ni sirve para
                proyectos indefinidos. Calza cuando el alcance y la entrega se
                pueden validar.
              </p>
            </div>
          </Reveal>
        </section>

        {/* 3.5 · CONCIENCIA / IMPACTO EN ESTUDIANTES
            El resto de la landing habla del valor para la org. Este bloque
            hace explícito el otro lado: al publicar un microproyecto acotado
            abren una primera experiencia real de colaboración. Sin certificados
            ni métricas inventadas. */}
        <section className="bg-surface">
          <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-6 sm:py-16">
            <FadeContent>
              <p className="text-xs font-semibold uppercase tracking-wide text-electric">
                El otro lado del microproyecto
              </p>
              <h2 className="mt-2.5 max-w-2xl text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Cuando publicas un desafío, también abres una puerta.
              </h2>
              <p className="mt-3 max-w-2xl text-muted">
                Muchos estudiantes de primeros años aún no han colaborado en algo
                real con alcance, plazos y feedback. Un microproyecto tuyo puede
                ser esa primera práctica segura antes de la práctica formal o el
                primer trabajo.
              </p>
            </FadeContent>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {IMPACTO_ESTUDIANTES.map((item, i) => (
                <FadeContent key={item.titulo} delay={0.05 * i}>
                  <div className="h-full rounded-2xl border border-border bg-white p-5">
                    <span className="text-xs font-semibold tabular-nums text-muted">
                      0{i + 1}
                    </span>
                    <h3 className="mt-2 text-base font-semibold text-ink">
                      {item.titulo}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">
                      {item.texto}
                    </p>
                  </div>
                </FadeContent>
              ))}
            </div>
          </div>
        </section>

        {/* 4 · CÓMO FUNCIONA */}
        <section id="como-funciona" className="scroll-mt-28 bg-white">
          <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-6 sm:py-20">
            {/* El título vive dentro de `ProcessStack` (no acá aparte): tiene
                que taparse con la tarjeta 1 y quedarse tapado el resto del
                scroll, y eso lo controla el mismo JS que anima las tarjetas —
                separado, dependía del `sticky` nativo de la tarjeta 1, que se
                libera de su punto fijo antes de que termine el resto de la
                pila y el título volvía a asomar. */}
            <ProcessStack
              titulo="Un proceso simple para empezar con claridad."
              pasos={PASOS}
            />
          </div>
        </section>

        {/* 5 · CONFIANZA Y CONTROL */}
        <section className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-6 sm:py-20">
          <Reveal>
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Lo que probablemente te preguntas antes de publicar.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {CONFIANZA.map((punto, i) => (
              <Reveal key={punto.titulo} delayMs={i * 60}>
                <div className="flex gap-4">
                  <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-sprout/15 text-sprout">
                    <svg
                      viewBox="0 0 24 24"
                      className="size-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink">{punto.titulo}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {punto.texto}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* 6 · FAQ */}
        <section className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6 sm:py-20">
          <Reveal>
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Preguntas frecuentes
            </h2>
          </Reveal>
          <Reveal delayMs={80}>
            <div className="mt-8">
              <Faq items={FAQ} />
            </div>
          </Reveal>
        </section>

        {/* 7 · BLOQUE PILOTO (CTA final, cercano) */}
        <section className="mx-auto w-full max-w-5xl px-5 pb-16 sm:px-6 sm:pb-28">
          <Reveal>
            <div className="flex flex-col gap-4 rounded-3xl border border-electric/20 bg-electric/5 p-8 sm:p-12">
              <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                No necesitas tener el desafío resuelto.
              </h2>
              <p className="max-w-xl text-muted">
                Cuéntanos la necesidad tal como la tienes hoy, aunque sea una idea
                suelta. En esta etapa piloto te acompañamos a acotarla en un desafío
                concreto antes de publicarlo, sin costo y sin compromiso.
              </p>
              <div className="mt-2">
                <Link
                  href="/contacto"
                  className={cn(
                    buttonClasses({ variant: "primary" }),
                    "h-11 px-6 text-base",
                  )}
                >
                  Hablar con CampusLab
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

      </main>

      <RevealFooter>
        <SiteFooter />
      </RevealFooter>
    </>
  );
}

/**
 * Composición del hero: tres bloques conectados (antes → desafío → resultado)
 * que muestran cómo una necesidad difusa se transforma en un proyecto acotado.
 */
function TransformacionHero() {
  return (
    <div className="relative">
      {/* Halo ambiental que respira detrás de la composición (decorativo). */}
      <div className="pointer-events-none absolute -inset-8 -z-10" aria-hidden>
        <div className="animate-breathe absolute right-2 top-2 size-40 rounded-full bg-electric/25 blur-3xl" />
        <div
          className="animate-breathe absolute bottom-2 left-2 size-40 rounded-full bg-sprout/25 blur-3xl"
          style={{ animationDelay: "-3.5s" }}
        />
      </div>

      <div className="flex flex-col gap-0">
        {TRANSFORMACION.map((bloque, i) => (
          <div key={bloque.etiqueta}>
            {/* Entrada escalonada: los bloques "arman" la transformación en
                secuencia (respeta reduced-motion). */}
            <div
              className={cn(
                "animate-rise rounded-2xl border p-5",
                bloque.destacado
                  ? "border-2 border-electric/40 bg-electric/10 shadow-[0_6px_20px_-8px_rgba(56,103,255,0.35)]"
                  : "border-border bg-white shadow-[0_4px_16px_-8px_rgba(13,37,59,0.18)]",
              )}
              style={{ animationDelay: `${250 + i * 250}ms` }}
            >
              <span
                className={cn(
                  "text-xs font-bold uppercase tracking-wide",
                  bloque.destacado ? "text-electric" : "text-ink/70",
                )}
              >
                {bloque.etiqueta}
              </span>
              <p className="mt-1.5 text-sm font-medium leading-relaxed text-ink">
                {bloque.texto}
              </p>
            </div>

            {/* Conector con pulso de luz que fluye hacia abajo. La línea entra
                con su tarjeta (`animate-rise`) y el pulso recién arranca cuando
                toda la composición terminó de entrar, encadenado como un relevo. */}
            {i < TRANSFORMACION.length - 1 && (
              <div
                className="animate-rise flex justify-center py-2"
                style={{ animationDelay: `${500 + i * 250}ms` }}
                aria-hidden
              >
                <div className="relative h-6 w-px bg-border">
                  <span
                    className="animate-flow-down absolute left-1/2 top-0 size-1.5 rounded-full bg-electric shadow-[0_0_8px_2px_rgba(56,103,255,0.6)]"
                    style={{ animationDelay: `${1600 + i * 1000}ms` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Hero · transformación de una necesidad en un proyecto.
const TRANSFORMACION = [
  {
    etiqueta: "Antes",
    texto: "Tengo datos, pero no logro convertirlos en decisiones.",
    destacado: false,
  },
  {
    etiqueta: "Desafío",
    texto: "Crear un dashboard inicial con indicadores operativos.",
    destacado: true,
  },
  {
    etiqueta: "Resultado",
    texto:
      "Una visualización para detectar mermas y priorizar acciones.",
    destacado: false,
  },
];

// Propuesta de valor (tres bloques). Sin iconos: tipografía + chip en la central.
const PROPUESTA = [
  {
    titulo: "Convierte una necesidad en un desafío claro",
    texto:
      "Sales con un desafío publicable: objetivo, alcance, habilidades pedidas y resultado esperado.",
  },
  {
    titulo: "Conserva visibilidad durante el proceso",
    texto:
      "Ves postulaciones, avances por hitos y validaciones en el momento que corresponde, sin improvisar el seguimiento.",
  },
  {
    titulo: "Obtén un resultado utilizable",
    texto:
      "Cierras con un entregable concreto (prototipo, análisis, propuesta o proceso documentado) alineado a lo que definiste.",
  },
];

// Ejemplos: ver `features/organizations/necesidades-ejemplo.ts`

// Impacto en estudiantes: conciencia para la org (sin vender certificado).
const IMPACTO_ESTUDIANTES = [
  {
    titulo: "Primera colaboración real",
    texto:
      "Practican trabajar con un objetivo, un plazo y alguien del otro lado que valida el avance.",
  },
  {
    titulo: "Ritmo de un proyecto vivo",
    texto:
      "Hitos, minutas y feedback puntual: la misma dinámica que después encontrarán en una práctica o un equipo.",
  },
  {
    titulo: "Confianza para el siguiente paso",
    texto:
      "Llegan a su práctica o primer trabajo habiendo cerrado algo concreto, no solo ejercicios de clase.",
  },
];

// Cómo funciona (cuatro pasos del lado de la organización).
const PASOS: ProcesoPaso[] = [
  {
    titulo: "Cuéntanos tu necesidad",
    texto:
      "Describe el problema, el contexto y el resultado que te serviría, aunque aún esté difuso.",
    icon: "mensaje",
  },
  {
    titulo: "Define un desafío acotado",
    texto:
      "Aterriza habilidades, duración (2–8 semanas), modalidad y entregables. Antes de publicarse, se revisa el alcance.",
    icon: "objetivo",
  },
  {
    titulo: "Revisa perfiles interesados",
    texto:
      "Recibes postulaciones a roles concretos y eliges quién forma el equipo.",
    icon: "personas",
  },
  {
    titulo: "Acompaña y valida",
    texto:
      "Sigues hitos, das retroalimentación puntual y cierras con la validación del entregable.",
    icon: "check",
  },
];

// Confianza y control: las preocupaciones concretas de quien nunca publicó un
// desafío (cuánto tiempo, qué recibe, qué pasa con su información, qué pasa si
// no calza, quién responde), no una repetición de "claridad/alcance" del hero.
// El lenguaje de "información"/"acompañamiento" refleja lo que existe hoy
// (coordinación entre partes, moderación previa, reportes) sin prometer un
// contrato de confidencialidad que el producto no tiene.
const CONFIANZA = [
  {
    titulo: "Cuánto tiempo dedicas",
    texto:
      "Revisar postulaciones y validar hitos toma bloques puntuales, no una dedicación diaria. Tú decides cuánto acompañar.",
  },
  {
    titulo: "Qué recibes al final",
    texto:
      "Un entregable concreto y usable (un prototipo, un análisis, una propuesta o un proceso documentado), coherente con lo que definiste al publicar.",
  },
  {
    titulo: "Cómo se protege tu información",
    texto:
      "No compartas información sensible por defecto: la confidencialidad se coordina entre las partes antes de comenzar, no es un campo que se publica.",
  },
  {
    titulo: "Qué pasa si no calza",
    texto:
      "Puedes ajustar el alcance, repostear o cerrar el desafío. No hay compromiso más allá de publicarlo.",
  },
  {
    titulo: "Quién acompaña o modera",
    texto:
      "Antes de publicarse, un moderador revisa el alcance del desafío; durante el proyecto, cualquiera de las partes puede reportar un problema.",
  },
];

// Preguntas frecuentes (respuestas breves, sin prometer lo no implementado).
const FAQ = [
  {
    q: "¿Qué tipo de organizaciones pueden participar?",
    a: "Organizaciones, pymes, emprendimientos, fundaciones e instituciones con una necesidad concreta que pueda trabajarse como microproyecto.",
  },
  {
    q: "¿Qué tipo de desafíos puedo publicar?",
    a: "Retos acotados con objetivo y entregable claros: dashboards, prototipos, investigación, contenido, mejoras de proceso u otros problemas pequeños que no justifiquen una contratación.",
  },
  {
    q: "¿Cuánto puede durar un microproyecto?",
    a: "Entre 2 y 8 semanas. Cada estudiante suele dedicar unas 3 a 6 horas semanales; tú defines el alcance al publicar.",
  },
  {
    q: "¿CampusLab reemplaza una contratación?",
    a: "No. Es una experiencia acotada para un desafío puntual con estudiantes; no sustituye un empleo ni una contratación.",
  },
];
