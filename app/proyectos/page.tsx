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
    <main className="flex-1 bg-surface">
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
      {/* Encabezado */}
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-ink">Explorar proyectos</h1>
        <p className="text-muted">Encuentra una oportunidad que calce contigo.</p>
      </header>

      {/* Conteo de oportunidades abiertas */}
      {projects.length > 0 && (
        <p className="mt-8 text-lg font-semibold text-ink">
          {projects.length}{" "}
          {projects.length === 1
            ? "oportunidad abierta"
            : "oportunidades abiertas"}
        </p>
      )}

      {/* Grilla o estado vacío */}
      {projects.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border bg-white px-6 py-16 text-center">
          <p className="font-medium text-ink">Todavía no hay proyectos publicados</p>
          <p className="mt-1 text-sm text-muted">
            Vuelve pronto: los proyectos aparecen aquí cuando una organización
            los publica.
          </p>
        </div>
      ) : (
        <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </section>
      )}
      </div>
    </main>
  );
}
