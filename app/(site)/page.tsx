import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
    </main>
  );
}
