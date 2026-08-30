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
          <div className="flex flex-col items-start gap-6">
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
            <div className="flex flex-col gap-4">
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
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Proyectos con un objetivo claro.
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {destacados.map((project) => (
                <ProjectCard key={project.id} project={project} />
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
          <Reveal delayMs={80}>
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
          <Reveal delayMs={160}>
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
    </main>
  );
}
