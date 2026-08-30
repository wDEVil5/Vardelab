import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/reveal";
import { Faq } from "@/components/faq";
import { PinnedPrinciples } from "@/components/pinned-principles";
import { SiteFooter } from "@/components/site-footer";
import { getPublishedProjects } from "@/features/projects/queries";
import { ProjectCard } from "@/features/projects/components/project-card";

/**
 * P-01 · Landing pública. Server Component: presenta CampusLab a estudiantes y
 * organizaciones y los lleva a una acción. Página de presentación (no un panel
 * autenticado), sobre los tokens de Foundations. Piloto independiente: sin
 * métricas, testimonios ni logos ficticios.
 */
export default async function Home() {
  const publicados = await getPublishedProjects();
  // Composición del hero: tarjetas reales del catálogo (sin ilustraciones).
  const heroProyectos = publicados.slice(0, 2);
  // Destacados: hasta 3 tarjetas, consistentes con el catálogo (P-02).
  const destacados = publicados.slice(0, 3);

  return (
    <>
      <main className="flex-1 bg-white">
      {/* 1 · HERO */}
      <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="flex animate-rise flex-col items-start gap-6">
            <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              Desafíos reales. Talento que se demuestra.
            </h1>
            <p className="max-w-md text-lg text-muted">
              CampusLab conecta estudiantes con organizaciones para resolver
              microproyectos claros, con objetivos, acompañamiento y evidencia de
              resultado.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href="/proyectos"
                className={cn(
                  buttonClasses({ variant: "primary" }),
                  "h-11 px-6 text-base",
                )}
              >
                Explorar proyectos
              </Link>
              <Link
                href="/organizaciones"
                className="group inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-electric"
              >
                Para organizaciones
                <span className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>
          </div>

          {/* Composición con tarjetas reales de proyecto. */}
          {heroProyectos.length > 0 && (
            <div
              className="flex animate-rise flex-col gap-4"
              style={{ animationDelay: "150ms" }}
            >
              {heroProyectos.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 2 · PROYECTOS DESTACADOS */}
      {destacados.length > 0 && (
        <section className="bg-surface">
          <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
            <Reveal>
              <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Proyectos con un objetivo claro.
              </h2>
              <p className="mt-2 text-muted">Roles abiertos para estudiantes.</p>
            </Reveal>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {destacados.map((project, i) => (
                <Reveal key={project.id} delayMs={i * 80} className="h-full">
                  <ProjectCard project={project} />
                </Reveal>
              ))}
            </div>
            <div className="mt-8">
              <Link
                href="/proyectos"
                className="text-sm font-medium text-electric hover:underline"
              >
                Ver todos los proyectos →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 3 · PROTAGONISMO ESTUDIANTE (+ acceso secundario a organizaciones) */}
      <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
        <Reveal>
          <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Construye experiencia que se demuestra.
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {/* Estudiantes: tarjeta protagonista. */}
          <Reveal delayMs={80} className="h-full lg:col-span-2">
            <div className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-white p-8 transition-all duration-200 hover:-translate-y-1 hover:border-electric/40 hover:shadow-lg sm:p-10">
              <span className="text-xs font-semibold uppercase tracking-wide text-electric">
                Estudiantes
              </span>
              <p className="text-2xl font-semibold text-ink sm:text-3xl">
                Resuelve desafíos reales y llévate evidencia de tu trabajo.
              </p>
              <p className="max-w-md text-muted">
                Postula a un rol, colabora por hitos y termina con un resultado
                concreto que puedes mostrar.
              </p>
              <Link
                href="/proyectos"
                className={cn(
                  buttonClasses({ variant: "primary" }),
                  "mt-2 h-11 w-fit px-6 text-base",
                )}
              >
                Explorar proyectos
              </Link>
            </div>
          </Reveal>

          {/* Organizaciones: acceso secundario a su propia landing. */}
          <Reveal delayMs={160} className="h-full">
            <div className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-8 transition-all duration-200 hover:-translate-y-1 hover:border-sprout/50">
              <span className="text-xs font-semibold uppercase tracking-wide text-sprout">
                Organizaciones
              </span>
              <p className="font-semibold text-ink">
                ¿Tienes una necesidad concreta?
              </p>
              <p className="text-sm text-muted">
                Transfórmala en un proyecto acotado con talento estudiantil.
              </p>
              <Link
                href="/organizaciones"
                className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-electric"
              >
                Conoce cómo funciona
                <span className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 4 · CÓMO FUNCIONA (flujo del estudiante como protagonista) */}
      <section id="como-funciona" className="scroll-mt-20 bg-surface">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
          <Reveal>
            <span className="text-xs font-semibold uppercase tracking-wide text-electric">
              Para estudiantes
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Del desafío al resultado, paso a paso.
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PASOS_ESTUDIANTE.map((paso, i) => (
              <Reveal key={paso.titulo} delayMs={i * 100} className="h-full">
                <div className="group relative flex h-full flex-col rounded-2xl border border-border bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                  <span className="text-4xl font-bold text-electric/20 transition-colors duration-300 group-hover:text-electric/40">
                    0{i + 1}
                  </span>
                  <h3 className="mt-3 font-semibold text-ink">{paso.titulo}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {paso.texto}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4.5 · PROPONER UN DESAFÍO (growth loop: el estudiante detecta necesidades) */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-4 sm:pb-8">
        <Reveal>
          <div className="flex flex-col gap-4 rounded-2xl border border-electric/20 bg-electric/5 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-ink">
                ¿Conoces una organización con un desafío?
              </p>
              <p className="mt-1 text-sm text-muted">
                Proponlo y ayúdanos a sumar proyectos reales para más estudiantes.
              </p>
            </div>
            <Link
              href="/proponer"
              className={cn(
                buttonClasses({ variant: "primary" }),
                "h-11 shrink-0 px-6 text-base",
              )}
            >
              Proponer un desafío
            </Link>
          </div>
        </Reveal>
      </section>

      {/* 5 · PRINCIPIOS (espacio diferenciador, anclado con scroll storytelling) */}
      <PinnedPrinciples items={PRINCIPIOS} />

      {/* 6 · PREGUNTAS FRECUENTES */}
      <section className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
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

      {/* 7 · CTA FINAL */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-20 sm:pb-28">
        <Reveal>
          <div className="rounded-3xl border border-border bg-surface px-6 py-16 text-center sm:px-12">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Convierte una necesidad o una habilidad en un proyecto con impacto.
            </h2>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
              <Link
                href="/proyectos"
                className={cn(
                  buttonClasses({ variant: "primary" }),
                  "h-11 px-6 text-base",
                )}
              >
                Explorar proyectos
              </Link>
              <Link
                href="/organizaciones"
                className="group inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-electric"
              >
                Para organizaciones
                <span className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
      </main>

      <SiteFooter />
    </>
  );
}

// Preguntas frecuentes de la landing.
const FAQ = [
  {
    q: "¿Qué tipo de proyectos se pueden publicar?",
    a: "Necesidades reales y acotadas —análisis de datos, prototipos, automatizaciones, contenido, investigación—, siempre con un objetivo y un entregable claros.",
  },
  {
    q: "¿Cuánto dura un microproyecto?",
    a: "Son cortos y acotados, del orden de pocas semanas. La organización define la duración según el alcance del desafío.",
  },
  {
    q: "¿Cómo se seleccionan los estudiantes?",
    a: "Cada estudiante postula a un rol del proyecto; la organización revisa las postulaciones y elige a quienes mejor calzan con el desafío.",
  },
  {
    q: "¿Qué recibe una organización?",
    a: "Una necesidad concreta avanzada por un equipo de estudiantes, con seguimiento por hitos y una entrega con evidencia del resultado.",
  },
  {
    q: "¿CampusLab reemplaza un puesto de trabajo?",
    a: "No. Es una experiencia acotada para resolver un desafío puntual y generar evidencia; no sustituye un empleo ni una contratación.",
  },
];

// Principios de CampusLab (sección diferenciadora).
const PRINCIPIOS = [
  {
    titulo: "Alcance definido",
    texto: "Objetivos, duración y entregables visibles desde el inicio.",
  },
  {
    titulo: "Seguimiento por hitos",
    texto: "Cada proyecto tiene avances y expectativas claras.",
  },
  {
    titulo: "Resultado demostrable",
    texto:
      "El trabajo genera evidencia útil para estudiantes y organizaciones.",
  },
];

// Pasos del flujo del estudiante (protagonista de "Cómo funciona").
const PASOS_ESTUDIANTE = [
  {
    titulo: "Crea tu perfil",
    texto: "Cuéntanos qué sabes hacer y qué te interesa.",
  },
  {
    titulo: "Postula a un desafío",
    texto: "Elige un rol que calce con tus habilidades.",
  },
  {
    titulo: "Entrega evidencia de tu trabajo",
    texto: "Colabora por hitos y termina con un resultado que puedes mostrar.",
  },
];
