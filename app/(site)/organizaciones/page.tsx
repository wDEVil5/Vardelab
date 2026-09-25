import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/reveal";
import { FadeContent } from "@/components/fade-content";
import { Faq } from "@/components/faq";
import { SiteFooter } from "@/components/site-footer";
import { RevealFooter } from "@/components/reveal-footer";
import { DesafiosExplorer } from "@/components/desafios-explorer";
import { ProcessStack, type ProcesoPaso } from "@/components/process-stack";
import { OrganizacionHeroVisual } from "@/components/organizacion-hero-visual";
import { EJEMPLOS_ORGANIZACION } from "@/features/organizations/necesidades-ejemplo";
import { ConfidenceCarousel } from "@/features/organizations/components/confidence-carousel";

export const metadata: Metadata = {
  title: "Para organizaciones · Vardelab",
  description:
    "Convierte una necesidad concreta en un microproyecto con alcance definido, estudiantes interesados y seguimiento visible de principio a fin.",
  alternates: { canonical: "/organizaciones" },
  openGraph: {
    title: "Para organizaciones · Vardelab",
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
        <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6 sm:py-24 lg:pb-32">
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
                a Vardelab. Si no convence, volver a TransformacionHero. */}
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

        {/* 2 · PROPUESTA DE VALOR — recorrido continuo, sin cards repetidas */}
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
            <div className="relative mt-10 overflow-hidden rounded-3xl border border-border bg-white">
              <div className="grid md:grid-cols-3">
                {PROPUESTA.map((item, i) => {
                  const etapa = ["Define", "Acompaña", "Cierra"][i];
                  return (
                    <FadeContent key={item.titulo} delay={0.06 * i} className="h-full">
                      <div
                        className={cn(
                          "relative flex h-full flex-col px-6 py-7 sm:px-8 sm:py-8",
                          i > 0 && "border-t border-border md:border-l md:border-t-0",
                        )}
                      >
                        <div className="flex items-center">
                          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                            {etapa}
                          </span>
                        </div>
                        <h3 className="mt-5 max-w-xs text-lg font-semibold tracking-tight text-ink">
                          {item.titulo}
                        </h3>
                        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
                          {item.texto}
                        </p>
                      </div>
                    </FadeContent>
                  );
                })}
              </div>
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
            <div className="mt-8 rounded-3xl bg-ink px-6 py-8 text-white sm:px-10 sm:py-10">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
                  El criterio Vardelab
                </p>
                <h3 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
                  Un desafío real tiene un comienzo, un destinatario y un cierre.
                </h3>
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-3 sm:gap-0">
                {[
                  {
                    titulo: "Necesidad real",
                    texto: "Resuelve algo que ya existe.",
                    icono: (
                      <path d="M12 3v18M3 12h18" />
                    ),
                  },
                  {
                    titulo: "Beneficiario claro",
                    texto: "Alguien usará o revisará el resultado.",
                    icono: (
                      <><circle cx="12" cy="8" r="3" /><path d="M5 20c.8-3.5 3.1-5.5 7-5.5s6.2 2 7 5.5" /></>
                    ),
                  },
                  {
                    titulo: "Alcance acotado",
                    texto: "Puede completarse en 2–8 semanas.",
                    icono: (
                      <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>
                    ),
                  },
                ].map((criterio, i) => (
                  <div
                    key={criterio.titulo}
                    className={cn(
                      "flex gap-3 sm:px-6",
                      i > 0 && "sm:border-l sm:border-white/15",
                      i === 0 && "sm:pl-0",
                      i === 2 && "sm:pr-0",
                    )}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sprout">
                      <svg
                        viewBox="0 0 24 24"
                        className="size-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        {criterio.icono}
                      </svg>
                    </span>
                    <div>
                      <p className="font-medium text-white">{criterio.titulo}</p>
                      <p className="mt-1 text-sm leading-relaxed text-white/60">
                        {criterio.texto}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-8 rounded-2xl bg-white/5 px-4 py-3 text-sm leading-relaxed text-white/60 sm:px-5">
                Vardelab no reemplaza un puesto de trabajo ni sirve para proyectos
                indefinidos. El desafío debe poder completarse dentro de un marco
                formativo de 2 a 8 semanas.
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
                Publicar un desafío también abre una primera oportunidad.
              </h2>
              <p className="mt-3 max-w-xl text-muted">
                Para muchos estudiantes es la primera vez que colaboran con una
                organización, plazos y feedback reales.
              </p>
            </FadeContent>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
              <FadeContent>
                <div className="max-w-md">
                  <p className="text-lg font-medium leading-relaxed text-ink sm:text-xl">
                    <span className="text-electric">Cerrar algo real</span> cambia
                    la forma en que un estudiante cuenta lo que sabe hacer.
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-muted">
                    No es solo práctica: es algo que puede mostrar y explicar
                    como propio.
                  </p>
                </div>
              </FadeContent>

              <FadeContent>
                <div className="divide-y divide-border border-y border-border">
                  {IMPACTO_ESTUDIANTES.map((item) => (
                    <div key={item.titulo} className="grid gap-2 py-5 sm:grid-cols-[minmax(10rem,0.7fr)_minmax(0,1fr)] sm:gap-8 sm:py-6">
                      <h3 className="text-base font-semibold text-ink">
                        {item.titulo}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted">
                        {item.texto}
                      </p>
                    </div>
                  ))}
                </div>
              </FadeContent>
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

        {/* 4.5 · SIGUIENTE PASO
            Hace explícito qué ocurre después del primer contacto sin crear una
            nueva ruta ni aumentar la fricción del formulario. */}
        <section className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-6 sm:py-14">
          <Reveal>
            <div className="rounded-2xl border border-border bg-surface px-6 py-7 sm:px-8 sm:py-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-xl">
                  <p className="text-xs font-semibold uppercase tracking-wide text-electric">
                    Después de contactarnos
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                    Te ayudamos a convertir la idea en un desafío publicable.
                  </h2>
                </div>
                <p className="max-w-md text-sm leading-relaxed text-muted">
                  No tienes que llegar con todo resuelto. Revisamos la necesidad,
                  conversamos el alcance y te orientamos antes de publicar.
                </p>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  "Cuéntanos la necesidad tal como existe hoy.",
                  "Aterrizamos objetivo, alcance y resultado esperado.",
                  "Confirmamos si está listo para abrirse a estudiantes.",
                ].map((item, i) => (
                  <div key={item} className="flex gap-3 text-sm text-ink">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-electric/10 text-xs font-semibold text-electric">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* 5 · CONFIANZA Y CONTROL */}
        <section className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-6 sm:py-20">
          <Reveal>
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Lo que probablemente te preguntas antes de publicar.
            </h2>
          </Reveal>
          <div className="mt-8">
            <ConfidenceCarousel items={CONFIANZA} />
          </div>
          <Reveal delayMs={180}>
            <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-ink">¿Eres docente o mentor?</p>
                <p className="mt-1 text-sm text-muted">
                  Ayuda a conectar una necesidad real con una experiencia de aprendizaje.
                </p>
              </div>
              <Link
                href="/contacto"
                className="group inline-flex min-h-11 items-center gap-1 text-sm font-medium text-electric transition-colors hover:text-ink"
              >
                Conversemos
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>
          </Reveal>
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
            <div className="flex flex-col items-center gap-8 rounded-3xl border border-electric/20 bg-electric/5 p-8 sm:p-12">
              <div className="w-full max-w-2xl">
                <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  No necesitas tener el desafío resuelto.
                </h2>
                <p className="mt-4 max-w-xl text-muted">
                  Cuéntanos la necesidad tal como la tienes hoy, aunque sea una idea
                  suelta. En esta etapa piloto te acompañamos a acotarla en un desafío
                  concreto antes de publicarlo, sin costo y sin compromiso.
                </p>
              </div>
              <div>
                <Link
                  href="/contacto"
                  aria-label="Hablar con Vardelab"
                  className={cn(
                    buttonClasses({ variant: "primary" }),
                    "group h-11 min-w-52 justify-center gap-2 px-6 text-base shadow-none transition-[background-color,box-shadow] duration-300 ease-out hover:bg-ink hover:shadow-[0_10px_22px_-12px_rgba(13,37,59,0.5)]",
                  )}
                >
                  Hablar con Vardelab
                  <span
                    aria-hidden
                    className="transition-transform duration-300 ease-out group-hover:translate-x-1"
                  >
                    →
                  </span>
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
    titulo: "Define un desafío que se pueda hacer",
    texto:
      "Convierte una necesidad concreta en un proyecto con objetivo, alcance, roles, habilidades y resultado esperado.",
  },
  {
    titulo: "Acompaña el avance sin perder el hilo",
    texto:
      "Revisa postulaciones, hitos, entregas y validaciones en un solo lugar, con claridad durante todo el proceso.",
  },
  {
    titulo: "Cierra con un resultado que sirve",
    texto:
      "Termina con un entregable concreto: prototipo, análisis, propuesta o proceso documentado, alineado con la necesidad inicial.",
  },
];

// Ejemplos: ver `features/organizations/necesidades-ejemplo.ts`

// Impacto en estudiantes: conciencia para la org (sin vender certificado).
const IMPACTO_ESTUDIANTES = [
  {
    titulo: "Primera colaboración real",
    texto:
      "Trabajan con un objetivo, un plazo y alguien que valida su avance.",
  },
  {
    titulo: "Ritmo de un proyecto vivo",
    texto:
      "Se organizan con hitos, entregas y feedback, como en cualquier equipo.",
  },
  {
    titulo: "Confianza para el siguiente paso",
    texto:
      "Pueden contar qué hicieron, qué decisiones tomaron y cuál fue el resultado.",
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
    icono: "clock" as const,
  },
  {
    titulo: "Qué recibes al final",
    texto:
      "Un entregable concreto y usable (un prototipo, un análisis, una propuesta o un proceso documentado), coherente con lo que definiste al publicar.",
    icono: "result" as const,
  },
  {
    titulo: "Cómo se protege tu información",
    texto:
      "No compartas información sensible por defecto: la confidencialidad se coordina entre las partes antes de comenzar, no es un campo que se publica.",
    icono: "shield" as const,
  },
  {
    titulo: "Qué pasa si no calza",
    texto:
      "Puedes ajustar el alcance, repostear o cerrar el desafío. No hay compromiso más allá de publicarlo.",
    icono: "refresh" as const,
  },
  {
    titulo: "Quién acompaña o modera",
    texto:
      "Antes de publicarse, un moderador revisa el alcance del desafío; durante el proyecto, cualquiera de las partes puede reportar un problema.",
    icono: "people" as const,
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
    q: "¿Vardelab reemplaza una contratación?",
    a: "No. Es una experiencia acotada para un desafío puntual con estudiantes; no sustituye un empleo ni una contratación.",
  },
];
