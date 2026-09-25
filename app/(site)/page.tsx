import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/reveal";
import { Faq } from "@/components/faq";
import { FadeContent } from "@/components/fade-content";
import { ParallaxBlock } from "@/components/parallax-image";
import { ProcessStack, type ProcesoPaso } from "@/components/process-stack";
import {
  PrinciplesShowcase,
  type PrincipleShowcaseItem,
} from "@/components/principles-showcase";
import { SiteFooter } from "@/components/site-footer";
import { RevealFooter } from "@/components/reveal-footer";
import { getPublishedProjects } from "@/features/projects/queries";
import { ProjectCard } from "@/features/projects/components/project-card";
import { HeroOpenProjects } from "@/features/projects/components/hero-open-projects";
import { EstudianteHeroVacio } from "@/components/estudiante-hero-visual";
import { cuposRestantesProyecto } from "@/features/projects/roles";

export const metadata: Metadata = {
  title: "Vardelab · Desafíos reales. Talento que se demuestra.",
  description:
    "Microdesafíos acotados junto a organizaciones: practica colaborar con alcance definido y acompañamiento por hitos.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Vardelab · Desafíos reales. Talento que se demuestra.",
  },
};

/**
 * P-01 · Landing pública. Server Component: presenta Vardelab a estudiantes y
 * organizaciones y los lleva a una acción. Página de presentación (no un panel
 * autenticado), sobre los tokens de Foundations. Piloto independiente: sin
 * métricas, testimonios ni logos ficticios.
 */
export default async function Home() {
  // Acotado a 30 (no el catálogo entero): esta página solo muestra hasta 6
  // destacados y hasta 3 con cupo abierto — traer los 6000+ del catálogo real
  // para descartar casi todo era el mismo anti-patrón ya resuelto en /proyectos.
  const publicados = await getPublishedProjects(30);
  // Destacados: hasta 6 tarjetas (dos filas de 3 en desktop, `lg:grid-cols-3`),
  // consistentes con el catálogo (P-02).
  const destacados = publicados.slice(0, 6);
  // Hero: pocos proyectos con cupo abierto real (calmo; máx. 3).
  const heroAbiertos = publicados
    .filter((p) => cuposRestantesProyecto(p) > 0)
    .slice(0, 3);

  return (
    <>
      <main className="relative z-10 min-h-[calc(100dvh-3.5rem)] flex-1 overflow-x-clip bg-white md:mb-(--footer-h,0px) md:shadow-[0_8px_24px_-16px_rgba(13,37,59,0.12)]">
      {/* 1 · HERO
          Percepción estudiante: eyebrow + CTA primario; organizaciones como
          link secundario. Ancla: rotación calmada de pocos proyectos con
          cupo abierto (tilt en desktop; sin tilt en mobile). */}
      <section className="relative mx-auto w-full max-w-6xl px-5 py-8 sm:px-6 sm:py-16 lg:py-20 lg:pb-22">
        {/* Móvil: solo mensaje + CTA (la ficha rotativa satura el primer pantallazo).
            md+: copy izquierda, card derecha. Los proyectos siguen abajo en el grid. */}
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-10 lg:gap-12">
            <div className="flex animate-rise flex-col items-start gap-5 sm:gap-7">
              <span className="text-xs font-semibold uppercase tracking-wide text-electric sm:text-sm">
                Para estudiantes
              </span>
              <h1 className="text-[1.85rem] font-bold leading-[1.15] tracking-tight text-ink sm:text-4xl sm:leading-tight lg:text-[3.25rem] lg:leading-[1.1]">
                Desafíos reales. Talento que se demuestra.
              </h1>
              <p className="max-w-lg text-base text-muted sm:text-lg sm:leading-relaxed lg:text-xl">
                Empieza con un microdesafío acotado: practica colaborar y llega
                a tu práctica o primer trabajo con más seguridad.
              </p>
              <div className="flex w-full flex-col items-start gap-4">
                <Link
                  href="/proyectos"
                  className={cn(
                    buttonClasses({ variant: "primary" }),
                    "h-12 w-full justify-center px-7 text-base sm:w-auto sm:text-lg",
                  )}
                >
                  Explorar proyectos
                </Link>
                <Link
                  href="/organizaciones"
                  className="group inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-electric"
                >
                  ¿Eres organización, pyme o fundación?
                  <span className="transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>
              </div>
            </div>

            <div className="hidden md:block">
              {heroAbiertos.length > 0 ? (
                // El tilt 3D de la tarjeta puede sacar sus esquinas fuera de
                // su propia caja — este clip es solo para eso. El glow de
                // `EstudianteHeroVacio` necesita lo contrario (aire para
                // difuminarse), por eso no envuelve los dos casos por igual.
                <div className="overflow-x-clip">
                  <HeroOpenProjects projects={heroAbiertos} />
                </div>
              ) : (
                <EstudianteHeroVacio />
              )}
            </div>
          </div>
      </section>

      {/* 2 · PROYECTOS DESTACADOS */}
      {destacados.length > 0 && (
        <section className="bg-surface">
          <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-6 sm:py-16">
            <Reveal>
              <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Proyectos con un objetivo claro.
              </h2>
              <p className="mt-2 text-muted">
                Roles abiertos, con alcance, plazo y entregable visibles en cada
                ficha.
              </p>
            </Reveal>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {destacados.map((project, i) => (
                <Reveal
                  key={project.id}
                  delayMs={i * 80}
                  className={cn("h-full", i >= 3 && "hidden sm:block")}
                >
                  <ProjectCard project={project} />
                </Reveal>
              ))}
            </div>
            <div className="mt-8">
              <Link
                href="/proyectos"
                className="group inline-flex items-center gap-1 text-sm font-medium text-electric transition-colors hover:text-electric"
              >
                Ver todos los proyectos
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
            </div>
          </div>
        </section>
      )}



      {/* 3 · TU PANEL (muestra el producto real, no solo lo describe) */}
      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6 sm:py-14">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#0d1b2e_0%,#0a1420_100%)] py-8 text-white sm:py-10 md:py-20">
            <div className="grid items-center gap-8 md:grid-cols-[1fr_1.15fr] md:gap-10">
              <div className="px-6 sm:px-10 md:pr-6">
                <span className="text-xs font-semibold uppercase tracking-wide text-electric sm:text-sm">
                  Tu recorrido
                </span>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  Todo lo que haces, claro desde el primer día.
                </h2>
                <p className="mt-3 max-w-md text-base leading-relaxed text-white/70">
                  Desde que postulas hasta que entregas, tienes en un solo lugar
                  el proyecto, tus próximos pasos y el avance que vas
                  construyendo.
                </p>
                <ul className="mt-8 flex flex-col gap-5">
                  {[
                    "Tu proyecto y el avance de cada hito.",
                    "Tus postulaciones, respuestas y próximos pasos.",
                    "Entregas claras para saber qué hacer y cuándo.",
                    "Evidencia de lo que aprendiste y aportaste.",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-base text-white/80">
                      <span
                        className="flex size-5 shrink-0 items-center justify-center rounded-full bg-sprout/20 text-sprout"
                        aria-hidden
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="size-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="hidden md:block">
                  <Link
                    href="/proyectos"
                    className={cn(
                      buttonClasses({ variant: "primary" }),
                      "mt-9 h-11 px-6 text-base",
                    )}
                  >
                    Explorar proyectos
                  </Link>
                </div>
              </div>

              <div className="px-6 sm:px-10 md:px-0">
                <ParallaxBlock className="overflow-hidden rounded-2xl bg-white shadow-2xl md:w-[142%]">
                  <Image
                    src="/landing/foto-inicio.webp"
                    alt="Panel del estudiante en Vardelab: progreso del proyecto, postulaciones y próximas entregas."
                    width={1800}
                    height={939}
                    className="block w-full"
                    sizes="100vw"
                    priority
                  />
                </ParallaxBlock>
              </div>

              <div className="flex justify-center px-6 md:hidden">
                <Link
                  href="/proyectos"
                  className={cn(
                    buttonClasses({ variant: "primary" }),
                    "h-11 px-6 text-base",
                  )}
                >
                  Explorar proyectos
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 4 · CÓMO FUNCIONA (flujo del estudiante como protagonista) */}
      <section id="como-funciona" className="scroll-mt-20 bg-white sm:scroll-mt-32">
        <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-6 sm:py-16">
          <ProcessStack
            titulo="Así empiezas, paso a paso."
            pasos={PASOS_ESTUDIANTE}
          />
        </div>
      </section>

      {/* 4.25 · CÓMO SURGIÓ — contenedor acotado (no full bleed) */}
      <section className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-6 sm:py-14">
        <FadeContent>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-10 sm:px-10 sm:py-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
            >
              <div className="animate-breathe absolute -top-12 -right-8 size-48 rounded-full bg-electric/15 blur-3xl" />
              <div
                className="animate-breathe absolute -bottom-14 -left-10 size-44 rounded-full bg-sprout/15 blur-3xl"
                style={{ animationDelay: "-3s" }}
              />
            </div>

            <div className="relative">
              <span className="text-xs font-semibold uppercase tracking-wide text-electric">
                Cómo surgió
              </span>
              <h2 className="mt-3 max-w-2xl text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Hay cosas que no se aprenden hasta que toca hacerlas de verdad.
              </h2>

              <div className="mt-9 grid gap-8 sm:mt-10 sm:gap-9">
                <div className="grid gap-3 sm:grid-cols-[9rem_1fr] sm:gap-8">
                  <p className="text-xs font-semibold tracking-wide text-electric uppercase sm:pt-1">
                    La pregunta
                  </p>
                  <p className="max-w-[65ch] text-base leading-relaxed text-muted sm:text-lg">
                    Al buscar la primera práctica, muchos estudiantes se
                    enfrentan a la misma pregunta: “¿Qué experiencia puedo
                    mostrar?” Han aprendido en clases, pero todavía no han
                    trabajado con un usuario real, un plazo y un equipo.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-[9rem_1fr] sm:gap-8">
                  <p className="text-xs font-semibold tracking-wide text-electric uppercase sm:pt-1">
                    La otra realidad
                  </p>
                  <p className="max-w-[65ch] text-base leading-relaxed text-muted sm:text-lg">
                    Al mismo tiempo, hay organizaciones con necesidades
                    concretas —mejorar un sitio, ordenar datos, probar una
                    idea— que no requieren contratar a un equipo completo.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-[9rem_1fr] sm:gap-8">
                  <p className="text-xs font-semibold tracking-wide text-electric uppercase sm:pt-1">
                    El encuentro
                  </p>
                  <p className="max-w-[65ch] text-base leading-relaxed text-muted sm:text-lg">
                    Vardelab surgió para conectar ambos lados: convertir esas
                    necesidades en microproyectos acotados, con acompañamiento
                    y un resultado que se puede mostrar. No reemplaza una
                    práctica; ofrece un lugar para empezar a hacer.
                  </p>
                </div>

                <blockquote className="max-w-2xl sm:ml-44">
                  <p className="text-xl font-semibold leading-snug tracking-tight text-ink sm:text-2xl">
                    La confianza profesional no aparece antes de empezar. Se
                    construye haciendo.
                  </p>
                </blockquote>
              </div>
            </div>
          </div>
        </FadeContent>
      </section>

      {/* 4.5 · PROPONER UN DESAFÍO (growth loop: el estudiante detecta necesidades) */}
      <section className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-6 sm:py-14">
        <Reveal>
          <div className="flex flex-col gap-6 py-2 sm:flex-row sm:items-center sm:gap-7">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-electric/20 bg-electric/5 text-electric">
              <svg
                viewBox="0 0 24 24"
                className="size-7"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="3" y="13" width="7" height="7" rx="1.8" />
                <rect x="14" y="4" width="7" height="7" rx="1.8" />
                <path d="M10 16.5h1.5a5 5 0 0 0 5-5V11" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="max-w-2xl text-xl font-semibold leading-snug tracking-tight text-ink sm:text-2xl">
                ¿Conoces una necesidad que podría convertirse en un microproyecto?
              </h2>
              <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
                Puede ser en tu organización o en una cercana. Cuéntanos qué hace
                falta y te ayudamos a darle un alcance claro.
              </p>
            </div>
            <Link
              href="/proponer"
              className={cn(
                buttonClasses({ variant: "primary" }),
                "group h-11 w-full shrink-0 justify-center gap-2.5 px-6 text-base shadow-none transition-[background-color,box-shadow] duration-300 ease-out hover:bg-ink hover:shadow-[0_10px_22px_-12px_rgba(13,37,59,0.5)] motion-reduce:transition-none sm:w-auto",
              )}
            >
              Proponer un desafío
              <span
                aria-hidden
                className="transition-transform duration-300 ease-out group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none"
              >
                →
              </span>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* 5 · PRINCIPIOS (espacio diferenciador, anclado con scroll storytelling) */}
      <PrinciplesShowcase items={PRINCIPIOS} />

      {/* 5.5 · RESULTADO PARA EL ESTUDIANTE
          Refuerza qué queda al finalizar sin sumar otra sección pesada. */}
      <section className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-6 sm:py-14">
        <Reveal>
          <div className="rounded-2xl border border-border bg-surface px-6 py-7 sm:px-8 sm:py-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-electric">
                Al terminar
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Qué puedes mostrar después de colaborar.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                No te llevas solo una experiencia: terminas con evidencia concreta
                de lo que hiciste y aprendiste.
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Un entregable real para mostrar.",
                "Tu contribución descrita con claridad.",
                "Retroalimentación sobre el proceso.",
                "Una experiencia documentada para tu portafolio.",
              ].map((item) => (
                <div key={item} className="flex gap-2.5 text-sm text-ink">
                  <span
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-sprout/20 text-sprout"
                    aria-hidden
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="size-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* 6 · PREGUNTAS FRECUENTES */}
      <section className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6 sm:py-16">
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
      <section className="mx-auto w-full max-w-5xl px-6 pb-14 sm:pb-20">
        <Reveal>
          <div className="rounded-3xl border border-border bg-surface px-6 py-12 text-center sm:px-12 sm:py-14">
            <h2 className="mx-auto max-w-2xl text-2xl font-bold tracking-tight text-ink sm:text-3xl md:text-4xl">
              Elige un rol abierto y empieza a colaborar.
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

      <RevealFooter>
        <SiteFooter />
      </RevealFooter>
    </>
  );
}

// Preguntas frecuentes de la landing (voz estudiante).
// Las dudas de organizaciones viven en /organizaciones.
const FAQ = [
  {
    q: "¿Puedo participar si recién estoy empezando?",
    a: "Sí. Busca roles marcados “apto sin experiencia” en el catálogo.",
  },
  {
    q: "¿Cuánto dura y cuánto tiempo me pide?",
    a: "Entre 2 y 8 semanas, con unas 3 a 6 horas semanales según el proyecto. Lo exacto está en cada ficha.",
  },
  {
    q: "¿Cómo postulo y quién decide?",
    a: "Eliges un rol abierto, envías tu postulación y la organización decide si te suma al equipo.",
  },
  {
    q: "¿Trabajo solo o en equipo?",
    a: "Depende del desafío: de 1 a 5 estudiantes, con roles definidos en la ficha.",
  },
  {
    q: "¿Me sirve para la práctica o el primer trabajo?",
    a: "Te da una primera experiencia de colaboración en un proyecto concreto. No reemplaza esos procesos formales.",
  },
  {
    q: "¿Vardelab es un empleo?",
    a: "No. Es una experiencia acotada para un desafío puntual; no sustituye un puesto ni una contratación.",
  },
];

// Principios de Vardelab (sección diferenciadora). Cada uno con un ejemplo
// concreto y verdadero ("en la práctica"), atado a una funcionalidad real.
const PRINCIPIOS: PrincipleShowcaseItem[] = [
  {
    icon: "alcance",
    titulo: "Alcance definido",
    texto:
      "Cada desafío nace con objetivos, plazo y entregable claros. Nada de tareas difusas a mitad de camino.",
    practica:
      "En la ficha ves duración, dedicación estimada y entregable antes de postular.",
  },
  {
    icon: "hitos",
    titulo: "Acompañamiento por hitos",
    texto:
      "Avanzas por etapas con retroalimentación en el camino. No estás solo hasta el final.",
    practica:
      "Entregas parciales que se revisan hito a hito, con seguimiento visible.",
  },
  {
    icon: "resultado",
    titulo: "Colaboración real",
    texto:
      "Trabajas con roles, plazos y herramientas de verdad: coordinación, no solo tareas sueltas.",
    practica:
      "Un desafío concreto en equipo de 1 a 5, junto a una organización, pyme, fundación u otra institución.",
  },
  {
    icon: "barrera",
    titulo: "Barrera baja",
    texto:
      "Hay roles pensados para empezar. Lo que importa es querer aprender haciendo.",
    practica: "Proyectos marcados “apto sin experiencia” en el catálogo.",
  },
];

// Pasos del flujo del estudiante (protagonista de "Cómo funciona").
const PASOS_ESTUDIANTE: ProcesoPaso[] = [
  {
    titulo: "Crea tu perfil",
    texto:
      "Regístrate y completa lo básico: carrera, habilidades e intereses, para poder postular.",
    icon: "personas",
  },
  {
    titulo: "Postula a un rol abierto",
    texto:
      "Elige un desafío acotado y un rol concreto; hay opciones marcadas apto sin experiencia.",
    icon: "objetivo",
  },
  {
    titulo: "Colabora por hitos",
    texto:
      "Trabajas con el equipo y la organización: avances por etapas, con seguimiento visible.",
    icon: "check",
  },
];
