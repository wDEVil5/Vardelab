import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/reveal";
import { Faq } from "@/components/faq";
import { SiteFooter } from "@/components/site-footer";
import { RevealFooter } from "@/components/reveal-footer";
import { DesafiosExplorer } from "@/components/desafios-explorer";

export const metadata: Metadata = {
  title: "Para organizaciones · CampusLab",
  description:
    "Convierte una necesidad concreta en un microproyecto con alcance definido, estudiantes interesados y seguimiento visible de principio a fin.",
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
      <main className="relative z-10 mb-(--footer-h,0px) min-h-[calc(100dvh-3.5rem)] flex-1 bg-white shadow-[0_8px_24px_-16px_rgba(13,37,59,0.12)]">
        {/* 1 · HERO */}
        <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="flex animate-rise flex-col items-start gap-6">
              <span className="text-xs font-semibold uppercase tracking-wide text-electric">
                Para organizaciones
              </span>
              <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
                Ese proyecto pendiente puede empezar a avanzar.
              </h1>
              <p className="max-w-md text-lg text-muted">
                Convierte una necesidad concreta en un microproyecto con alcance
                definido, estudiantes interesados y seguimiento visible de
                principio a fin.
              </p>
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3">
                <Link
                  href="/contacto"
                  className={cn(
                    buttonClasses({ variant: "primary" }),
                    "h-11 w-full whitespace-nowrap px-6 text-base sm:w-auto",
                  )}
                >
                  Cuéntanos qué necesitas resolver
                </Link>
                <Link
                  href="/proyectos"
                  className="group inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-electric"
                >
                  Ver ejemplos de desafíos
                  <span className="transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>
              </div>
            </div>

            {/* Composición: transformación de una necesidad en un proyecto.
                Información útil (antes → desafío → resultado), no ilustración. */}
            <TransformacionHero />
          </div>
        </section>

        {/* 2 · PROPUESTA DE VALOR */}
        <section className="bg-surface">
          <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
            <Reveal>
              <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Avanza una necesidad sin perder claridad.
              </h2>
              <p className="mt-3 max-w-xl text-muted">
                CampusLab está pensado para retos acotados que necesitan una
                primera solución, una mirada nueva o una entrega concreta.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {PROPUESTA.map((item, i) => (
                <Reveal key={item.titulo} delayMs={i * 80} className="h-full">
                  <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-white p-6">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-electric/10 text-electric">
                      {item.icono}
                    </span>
                    <h3 className="font-semibold text-ink">{item.titulo}</h3>
                    <p className="text-sm leading-relaxed text-muted">
                      {item.texto}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 3 · QUÉ TIPO DE DESAFÍOS FUNCIONAN */}
        <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
          <Reveal>
            <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Los mejores desafíos son concretos y alcanzables.
            </h2>
            <p className="mt-3 max-w-2xl text-muted">
              No necesitas tener un proyecto completamente resuelto. Basta con
              una necesidad clara que pueda trabajarse con un objetivo, una
              duración y un entregable definido.
            </p>
          </Reveal>

          <Reveal delayMs={80}>
            <div className="mt-10">
              <DesafiosExplorer items={EJEMPLOS} />
            </div>
          </Reveal>

          {/* Bloque honesto y destacado (rompe el patrón claro con tono serio). */}
          <Reveal>
            <div className="mt-8 rounded-2xl bg-ink px-6 py-8 text-white sm:px-10">
              <p className="max-w-3xl text-lg leading-relaxed">
                CampusLab no reemplaza un puesto de trabajo ni sirve para
                proyectos indefinidos. Funciona mejor cuando existe una necesidad
                concreta, un alcance claro y una entrega que se pueda validar.
              </p>
            </div>
          </Reveal>
        </section>

        {/* 4 · CÓMO FUNCIONA */}
        <section id="como-funciona" className="scroll-mt-20 bg-surface">
          <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
            <Reveal>
              <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Un proceso simple para empezar con claridad.
              </h2>
            </Reveal>

            {/* Línea de tiempo: nodos numerados conectados. La línea corre por
                detrás de los nodos y se oculta en móvil (donde se apilan). El
                anillo `border-surface` deja un corte visual entre línea y nodo. */}
            <div className="relative mt-12">
              <div
                className="absolute inset-x-0 top-7 hidden h-px bg-border lg:block"
                aria-hidden
              />
              <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                {PASOS.map((paso, i) => (
                  <Reveal key={paso.titulo} delayMs={i * 100}>
                    <div className="flex flex-col gap-4">
                      <span className="relative z-10 flex size-14 items-center justify-center rounded-full border-4 border-surface bg-electric text-xl font-bold text-white">
                        {i + 1}
                      </span>
                      <h3 className="text-lg font-semibold text-ink">
                        {paso.titulo}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted">
                        {paso.texto}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 5 · CONFIANZA Y CONTROL */}
        <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
          <Reveal>
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Un proyecto claro para ambas partes.
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

        {/* 6 · BLOQUE PILOTO (cercano y humano) */}
        <section className="mx-auto w-full max-w-5xl px-6 pb-16 sm:pb-20">
          <Reveal>
            <div className="flex flex-col gap-4 rounded-3xl border border-electric/20 bg-electric/5 p-8 sm:p-12">
              <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                ¿No sabes aún cómo convertir tu necesidad en un desafío?
              </h2>
              <p className="max-w-xl text-muted">
                En esta etapa piloto, CampusLab puede ayudarte a identificar si tu
                necesidad calza con un microproyecto y a definir una primera
                versión del desafío.
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

        {/* 7 · FAQ */}
        <section className="mx-auto w-full max-w-3xl px-6 pb-16 sm:pb-20">
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

        {/* 8 · CTA FINAL */}
        <section className="mx-auto w-full max-w-5xl px-6 pb-20 sm:pb-28">
          <Reveal>
            <div className="rounded-3xl border border-border bg-surface px-6 py-16 text-center sm:px-12">
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Una necesidad concreta puede convertirse en un avance real.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted">
                Cuéntanos qué necesitas resolver y descubre si puede transformarse
                en un desafío para CampusLab.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap sm:gap-6">
                <Link
                  href="/contacto"
                  className={cn(
                    buttonClasses({ variant: "primary" }),
                    "h-11 w-full whitespace-nowrap px-6 text-base sm:w-auto",
                  )}
                >
                  Cuéntanos qué necesitas resolver
                </Link>
                <Link
                  href="/proyectos"
                  className="group inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-electric"
                >
                  Explorar proyectos
                  <span className="transition-transform group-hover:translate-x-0.5">
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
                "animate-rise rounded-2xl border p-5 shadow-sm backdrop-blur-sm",
                bloque.destacado
                  ? "border-electric/30 bg-electric/10"
                  : "border-border bg-white/80",
              )}
              style={{ animationDelay: `${250 + i * 250}ms` }}
            >
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-wide",
                  bloque.destacado ? "text-electric" : "text-muted",
                )}
              >
                {bloque.etiqueta}
              </span>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">
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

// Propuesta de valor (tres bloques). Iconos lineales simples.
const PROPUESTA = [
  {
    titulo: "Convierte una necesidad en un desafío claro",
    texto:
      "Define objetivo, alcance, habilidades y resultado esperado antes de publicar.",
    icono: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </svg>
    ),
  },
  {
    titulo: "Conserva visibilidad durante el proceso",
    texto:
      "Revisa postulaciones, acompaña hitos y valida el avance cuando corresponde.",
    icono: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    titulo: "Obtén un resultado utilizable",
    texto:
      "Recibe un prototipo, análisis, propuesta o entrega concreta para seguir avanzando.",
    icono: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
  },
];

// Ejemplos de desafíos que funcionan bien. El entregable ilustra el resultado
// acotado que la organización puede esperar (sin prometer capacidades no
// implementadas).
const EJEMPLOS = [
  {
    titulo: "Visualizar datos operativos",
    texto: "Crear un dashboard inicial para identificar oportunidades.",
    entregable:
      "Un tablero con los indicadores clave y una guía breve de lectura.",
  },
  {
    titulo: "Entender la experiencia de clientes",
    texto: "Investigar puntos de fricción y proponer mejoras.",
    entregable:
      "Un mapa de fricciones priorizado con recomendaciones accionables.",
  },
  {
    titulo: "Diseñar un prototipo digital",
    texto: "Convertir una idea en un flujo o interfaz inicial.",
    entregable: "Un flujo navegable o wireframes de las pantallas principales.",
  },
  {
    titulo: "Ordenar un proceso",
    texto: "Mapear tareas, detectar problemas y proponer una mejora.",
    entregable:
      "Un diagrama del proceso actual y una propuesta de mejora concreta.",
  },
  {
    titulo: "Crear una estrategia de contenido",
    texto: "Definir una base de comunicación para una iniciativa.",
    entregable: "Un plan base con temas, formatos y un calendario inicial.",
  },
  {
    titulo: "Transformar información en decisiones",
    texto: "Organizar datos y presentar hallazgos accionables.",
    entregable: "Un informe con hallazgos y próximos pasos sugeridos.",
  },
];

// Cómo funciona (cuatro pasos del lado de la organización).
const PASOS = [
  {
    titulo: "Cuéntanos tu necesidad",
    texto: "Describe el problema, contexto y resultado que buscas.",
  },
  {
    titulo: "Define un desafío acotado",
    texto: "Aterriza habilidades, duración, modalidad y entregables.",
  },
  {
    titulo: "Revisa perfiles interesados",
    texto: "Conoce postulaciones y selecciona según tu necesidad.",
  },
  {
    titulo: "Acompaña y valida",
    texto:
      "Sigue hitos, entrega retroalimentación y revisa el resultado final.",
  },
];

// Confianza y control (cuatro puntos). Lenguaje de expectativas, sin garantías.
const CONFIANZA = [
  {
    titulo: "Expectativas visibles",
    texto: "Objetivo, alcance y resultado esperado desde el inicio.",
  },
  {
    titulo: "Perfiles con contexto",
    texto:
      "Habilidades, disponibilidad y presentación visibles al revisar postulaciones.",
  },
  {
    titulo: "Seguimiento por hitos",
    texto:
      "Avances concretos para mantener visibilidad durante el proyecto.",
  },
  {
    titulo: "Cierre con evidencia",
    texto: "Retroalimentación y resultado final documentado.",
  },
];

// Preguntas frecuentes (respuestas breves, sin prometer lo no implementado).
const FAQ = [
  {
    q: "¿Qué tipo de organizaciones pueden participar?",
    a: "Organizaciones, pymes, emprendimientos, fundaciones e instituciones con una necesidad concreta que pueda trabajarse como un microproyecto acotado.",
  },
  {
    q: "¿Qué tipo de desafíos puedo publicar?",
    a: "Retos acotados con un objetivo y un entregable claros: análisis de datos, prototipos, investigación, contenido o mejoras de proceso, entre otros.",
  },
  {
    q: "¿Cuánto puede durar un microproyecto?",
    a: "Son cortos y acotados, del orden de pocas semanas. Tú defines la duración según el alcance del desafío.",
  },
  {
    q: "¿Qué necesito preparar antes de publicar?",
    a: "Una necesidad clara: el problema, el contexto, las habilidades que imaginas y el resultado que esperas. No hace falta tener la solución.",
  },
  {
    q: "¿Cómo se revisan las postulaciones?",
    a: "Recibes las postulaciones de estudiantes interesados con su presentación y habilidades, y seleccionas según tu necesidad.",
  },
  {
    q: "¿Qué ocurre durante el proyecto?",
    a: "El trabajo avanza por hitos: puedes seguir el progreso, entregar retroalimentación y validar el avance cuando corresponde.",
  },
  {
    q: "¿CampusLab reemplaza una contratación?",
    a: "No. Es una experiencia acotada para resolver un desafío puntual y generar evidencia; no sustituye un empleo ni una contratación.",
  },
  {
    q: "¿Qué pasa si necesito ayuda para definir mi desafío?",
    a: "En esta etapa piloto podemos ayudarte a identificar si tu necesidad calza con un microproyecto y a definir una primera versión del desafío.",
  },
];
