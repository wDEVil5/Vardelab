import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/reveal";
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
            <div className="flex flex-wrap items-center gap-3">
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
                href="/registro?rol=patrocinador"
                className={cn(
                  buttonClasses({ variant: "secondary" }),
                  "h-11 border border-border bg-white px-6 text-base",
                )}
              >
                Publicar un desafío
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

      {/* 3 · DOS CAMINOS */}
      <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
        <Reveal>
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Una plataforma, dos formas de participar.
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Reveal delayMs={80} className="h-full">
            <div className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-white p-8 transition-all duration-200 hover:-translate-y-1 hover:border-electric/40 hover:shadow-lg">
              <span className="text-xs font-semibold uppercase tracking-wide text-electric">
                Estudiantes
              </span>
              <p className="text-lg font-semibold text-ink">
                Construye experiencia resolviendo desafíos reales.
              </p>
              <Link
                href="/proyectos"
                className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-electric"
              >
                Explorar proyectos
                <span className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>
          </Reveal>
          <Reveal delayMs={160} className="h-full">
            <div className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-white p-8 transition-all duration-200 hover:-translate-y-1 hover:border-sprout/50 hover:shadow-lg">
              <span className="text-xs font-semibold uppercase tracking-wide text-sprout">
                Organizaciones
              </span>
              <p className="text-lg font-semibold text-ink">
                Transforma una necesidad concreta en un proyecto acotado.
              </p>
              <Link
                href="/registro?rol=patrocinador"
                className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-electric"
              >
                Publicar un desafío
                <span className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 4 · CÓMO FUNCIONA */}
      <section id="como-funciona" className="scroll-mt-20 bg-surface">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
          <Reveal>
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Del desafío al resultado, paso a paso.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-16">
            <Flujo
              eyebrow="Para estudiantes"
              tone="electric"
              pasos={[
                "Crea tu perfil",
                "Postula a un desafío",
                "Entrega evidencia de tu trabajo",
              ]}
            />
            <Flujo
              eyebrow="Para organizaciones"
              tone="sprout"
              pasos={[
                "Define una necesidad",
                "Publica tu desafío",
                "Revisa avances y valida el resultado",
              ]}
            />
          </div>
        </div>
      </section>

      {/* 5 · PRINCIPIOS (espacio diferenciador, en oscuro) */}
      <section className="relative overflow-hidden bg-ink text-white">
        {/* Glows sutiles: dan profundidad sin coste de animación. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 size-96 rounded-full bg-electric/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/4 size-72 rounded-full bg-sprout/10 blur-3xl"
        />
        <div className="relative mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
          <Reveal>
            <h2 className="max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">
              Experiencias claras para ambas partes.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {PRINCIPIOS.map((p, i) => (
              <Reveal key={p.titulo} delayMs={i * 100}>
                <div className="group">
                  <span className="text-sm font-semibold text-electric">
                    0{i + 1}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold">{p.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    {p.texto}
                  </p>
                  <div className="mt-5 h-px w-10 bg-white/20 transition-all duration-300 group-hover:w-20 group-hover:bg-electric" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

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

// Tonos por flujo (clases completas para que Tailwind las incluya).
const NODO_TONE = {
  electric: "group-hover:border-electric group-hover:bg-electric",
  sprout: "group-hover:border-sprout group-hover:bg-sprout",
} as const;
const EYEBROW_TONE = {
  electric: "text-electric",
  sprout: "text-sprout",
} as const;

/** Flujo vertical de pasos numerados con línea conectora y reveal escalonado. */
function Flujo({
  eyebrow,
  tone,
  pasos,
}: {
  eyebrow: string;
  tone: keyof typeof NODO_TONE;
  pasos: string[];
}) {
  return (
    <div>
      <span
        className={cn(
          "text-xs font-semibold uppercase tracking-wide",
          EYEBROW_TONE[tone],
        )}
      >
        {eyebrow}
      </span>
      <ol className="relative mt-6 flex flex-col gap-6">
        {/* Línea conectora detrás de los nodos. */}
        <span
          aria-hidden
          className="absolute bottom-4 left-4 top-4 w-px bg-border"
        />
        {pasos.map((paso, i) => (
          <Reveal key={paso} delayMs={i * 120}>
            <li className="group relative flex items-center gap-4">
              <span
                className={cn(
                  "z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-border bg-white text-sm font-semibold text-muted transition-colors group-hover:text-white",
                  NODO_TONE[tone],
                )}
              >
                {i + 1}
              </span>
              <p className="font-medium text-ink">{paso}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
