import type { Metadata } from "next";
import { getPublishedProjects } from "@/features/projects/queries";
import { ProjectCard } from "@/features/projects/components/project-card";

export const metadata: Metadata = {
  title: "Proyectos · CampusLab",
  description:
    "Catálogo de microproyectos reales publicados por organizaciones. Encuentra un rol y postula.",
};

/**
 * P-02 · Catálogo público de proyectos.
 * Server Component: los datos se resuelven en el servidor (SSR) con el cliente
 * anónimo; la RLS ya limita la lectura a proyectos publicados.
 */
export default async function ProyectosPage() {
  const projects = await getPublishedProjects();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      {/* Encabezado */}
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-ink">Proyectos</h1>
        <p className="max-w-2xl text-muted">
          Microproyectos reales publicados por organizaciones. Explora los roles
          disponibles y postula al que se ajuste a lo que sabes hacer.
        </p>
      </header>

      {/* Grilla o estado vacío */}
      {projects.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <p className="font-medium text-ink">Todavía no hay proyectos publicados</p>
          <p className="mt-1 text-sm text-muted">
            Vuelve pronto: los proyectos aparecen aquí cuando una organización
            los publica.
          </p>
        </div>
      ) : (
        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </section>
      )}
    </main>
  );
}
