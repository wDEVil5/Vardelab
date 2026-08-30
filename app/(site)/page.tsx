import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPublishedProjects } from "@/features/projects/queries";
import { ProjectCard } from "@/features/projects/components/project-card";

/**
 * P-01 · Landing pública. Server Component: presenta la propuesta y destaca un
 * proyecto real del catálogo. Alineada al diseño de Figma (frame P-01), sobre
 * los tokens de Foundations.
 */
export default async function Home() {
  // Proyecto destacado: el más reciente del catálogo público (si hay).
  const publicados = await getPublishedProjects();
  const destacado = publicados[0] ?? null;

  return (
    <main className="flex-1 bg-surface">
      <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
        {/* Hero: propuesta a la izquierda, tarjeta de marca a la derecha. */}
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col items-start gap-5">
            <span className="rounded-full bg-electric/10 px-3 py-1 text-sm font-medium text-electric">
              Para estudiantes UNAB
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              Convierte tu talento en experiencia real
            </h1>
            <p className="max-w-md text-lg text-muted">
              Microproyectos reales que conectan estudiantes con necesidades de
              organizaciones.
            </p>
            <div className="mt-2 flex flex-col items-start gap-3">
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
                className="text-sm font-medium text-electric hover:underline"
              >
                Soy una organización →
              </Link>
            </div>
          </div>

          {/* Tarjeta de marca: del desafío al portafolio + métricas del piloto. */}
          <div className="flex flex-col gap-4 rounded-2xl bg-ink p-8 text-white">
            <span className="font-medium text-white/90">CampusLab</span>
            <h2 className="text-2xl font-bold">Del desafío a tu portafolio</h2>
            <p className="text-white/70">
              Un piloto guiado, con evidencia verificable y acompañamiento.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-white/5 p-6">
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-bold text-white">10+</span>
                <span className="text-sm text-white/60">proyectos piloto</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-bold text-sprout">4 sem</span>
                <span className="text-sm text-white/60">duración promedio</span>
              </div>
            </div>
          </div>
        </section>

        {/* Proyecto destacado: una ficha real del catálogo. */}
        {destacado && (
          <section className="mt-16">
            <h2 className="text-lg font-semibold text-ink">
              Proyecto destacado
            </h2>
            <div className="mt-4 max-w-md">
              <ProjectCard project={destacado} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
