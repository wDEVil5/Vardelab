import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedProjects } from "@/features/projects/queries";
import {
  filterProjects,
  projectSkillFacets,
  type ProjectFilters,
} from "@/features/projects/filters";
import { ProjectCard } from "@/features/projects/components/project-card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Proyectos · CampusLab",
  description:
    "Catálogo de microproyectos reales publicados por organizaciones. Encuentra un rol y postula.",
};

// Modalidades disponibles como chips (enum project_modality).
const MODALIDADES: { value: string; label: string }[] = [
  { value: "remoto", label: "Remoto" },
  { value: "presencial", label: "Presencial" },
  { value: "hibrido", label: "Híbrido" },
];

type PageProps = {
  searchParams: Promise<{ q?: string; skill?: string; modalidad?: string }>;
};

/**
 * P-02 · Catálogo público de proyectos, con búsqueda y filtros.
 * Server Component: los proyectos se resuelven por SSR (la RLS limita a
 * publicados) y el filtrado se aplica sobre los `searchParams` de la URL.
 */
export default async function ProyectosPage({ searchParams }: PageProps) {
  const filters = (await searchParams) as ProjectFilters;
  const todos = await getPublishedProjects();

  const skills = projectSkillFacets(todos);
  const projects = filterProjects(todos, filters);
  const filtrando = Boolean(filters.q || filters.skill || filters.modalidad);

  // Arma un href de /proyectos conservando el resto de filtros y alternando uno.
  const hrefCon = (cambios: Partial<ProjectFilters>) => {
    const merged = { ...filters, ...cambios };
    const sp = new URLSearchParams();
    if (merged.q) sp.set("q", merged.q);
    if (merged.skill) sp.set("skill", merged.skill);
    if (merged.modalidad) sp.set("modalidad", merged.modalidad);
    const qs = sp.toString();
    return qs ? `/proyectos?${qs}` : "/proyectos";
  };

  const chip = (activo: boolean) =>
    cn(
      "rounded-full px-3 py-1 text-sm font-medium transition-colors",
      activo
        ? "bg-ink text-white"
        : "bg-electric/10 text-electric hover:bg-electric/20",
    );

  return (
    <main className="flex-1 bg-surface">
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        {/* Encabezado */}
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-ink">Explorar proyectos</h1>
          <p className="text-muted">Encuentra una oportunidad que calce contigo.</p>
        </header>

        {/* Buscador (GET): conserva los filtros activos como campos ocultos. */}
        <form action="/proyectos" method="get" className="mt-8">
          {filters.skill && (
            <input type="hidden" name="skill" value={filters.skill} />
          )}
          {filters.modalidad && (
            <input type="hidden" name="modalidad" value={filters.modalidad} />
          )}
          <input
            type="search"
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Buscar por tema, rol o impacto"
            className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-electric focus:outline-none"
          />
        </form>

        {/* Chips de habilidad */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={hrefCon({ skill: undefined })} className={chip(!filters.skill)}>
            Todos
          </Link>
          {skills.map((s) => (
            <Link
              key={s}
              href={hrefCon({ skill: s })}
              className={chip(filters.skill === s)}
            >
              {s}
            </Link>
          ))}
        </div>

        {/* Chips de modalidad */}
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href={hrefCon({ modalidad: undefined })}
            className={chip(!filters.modalidad)}
          >
            Cualquier modalidad
          </Link>
          {MODALIDADES.map((m) => (
            <Link
              key={m.value}
              href={hrefCon({ modalidad: m.value })}
              className={chip(filters.modalidad === m.value)}
            >
              {m.label}
            </Link>
          ))}
        </div>

        {/* Conteo */}
        <p className="mt-8 text-lg font-semibold text-ink">
          {projects.length}{" "}
          {projects.length === 1
            ? "oportunidad abierta"
            : "oportunidades abiertas"}
        </p>

        {/* Grilla, estado vacío por filtro, o catálogo vacío */}
        {projects.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-border bg-white px-6 py-16 text-center">
            {filtrando ? (
              <>
                <p className="font-medium text-ink">
                  Ningún proyecto coincide con tu búsqueda
                </p>
                <p className="mt-1 text-sm text-muted">
                  Prueba con otros términos o quita algún filtro.
                </p>
                <Link
                  href="/proyectos"
                  className="mt-4 inline-block text-sm font-medium text-electric hover:underline"
                >
                  Limpiar filtros
                </Link>
              </>
            ) : (
              <>
                <p className="font-medium text-ink">
                  Todavía no hay proyectos publicados
                </p>
                <p className="mt-1 text-sm text-muted">
                  Vuelve pronto: los proyectos aparecen aquí cuando una
                  organización los publica.
                </p>
              </>
            )}
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
