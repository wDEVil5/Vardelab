import type { Metadata } from "next";
import Link from "next/link";
import {
  getCatalogSkillFacets,
  getPublishedProjectsPage,
} from "@/features/projects/queries";
import { ProjectCard } from "@/features/projects/components/project-card";
import { CatalogSearch } from "@/features/projects/components/catalog-search";
import { Pagination } from "@/components/pagination";
import { ChipScroller } from "@/components/chip-scroller";
import { SiteFooter } from "@/components/site-footer";
import { RevealFooter } from "@/components/reveal-footer";
import { cn } from "@/lib/utils";

type ProjectFilters = { q?: string; skill?: string; modalidad?: string };

export const metadata: Metadata = {
  title: "Proyectos · CampusLab",
  description:
    "Catálogo de microproyectos reales publicados por organizaciones. Encuentra un rol y postula.",
  openGraph: {
    title: "Proyectos · CampusLab",
    description:
      "Catálogo de microproyectos reales publicados por organizaciones. Encuentra un rol y postula.",
  },
};

// Modalidades disponibles como chips (enum project_modality).
const MODALIDADES: { value: string; label: string }[] = [
  { value: "remoto", label: "Remoto" },
  { value: "presencial", label: "Presencial" },
  { value: "hibrido", label: "Híbrido" },
];

type PageProps = {
  searchParams: Promise<{
    q?: string;
    skill?: string;
    modalidad?: string;
    page?: string;
  }>;
};

/**
 * P-02 · Catálogo público de proyectos, con búsqueda, filtros y paginación
 * real (M78): búsqueda/filtros/orden/paginación se resuelven en SQL
 * (`getPublishedProjectsPage`), no trayendo el catálogo completo a memoria.
 */
export default async function ProyectosPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const filters: ProjectFilters = {
    q: rawParams.q,
    skill: rawParams.skill,
    modalidad: rawParams.modalidad,
  };
  const page = Math.max(1, Number.parseInt(rawParams.page ?? "1", 10) || 1);

  const [skills, { projects, total, pageSize }] = await Promise.all([
    getCatalogSkillFacets(),
    getPublishedProjectsPage(page, filters),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const filtrando = Boolean(filters.q || filters.skill || filters.modalidad);

  // Arma un href de /proyectos conservando el resto de filtros y alternando
  // uno — cambiar cualquier filtro vuelve a la página 1.
  const hrefCon = (cambios: Partial<ProjectFilters>) => {
    const merged = { ...filters, ...cambios };
    const sp = new URLSearchParams();
    if (merged.q) sp.set("q", merged.q);
    if (merged.skill) sp.set("skill", merged.skill);
    if (merged.modalidad) sp.set("modalidad", merged.modalidad);
    const qs = sp.toString();
    return qs ? `/proyectos?${qs}` : "/proyectos";
  };

  const hrefForPage = (n: number) => {
    const sp = new URLSearchParams();
    if (filters.q) sp.set("q", filters.q);
    if (filters.skill) sp.set("skill", filters.skill);
    if (filters.modalidad) sp.set("modalidad", filters.modalidad);
    if (n > 1) sp.set("page", String(n));
    const qs = sp.toString();
    return qs ? `/proyectos?${qs}` : "/proyectos";
  };

  const chip = (activo: boolean) =>
    cn(
      "shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium transition-colors",
      activo
        ? "bg-ink text-white"
        : "bg-electric/10 text-electric hover:bg-electric/20",
    );

  return (
    <>
      <main className="relative z-10 md:mb-(--footer-h,0px) min-h-[calc(100dvh-3.5rem)] flex-1 bg-white md:shadow-[0_8px_24px_-16px_rgba(13,37,59,0.12)]">
        <div className="mx-auto w-full max-w-5xl px-6 py-10">
          {/* Encabezado */}
          <header className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-ink">Explorar proyectos</h1>
            <p className="text-muted">
              Encuentra una oportunidad que calce contigo.
            </p>
          </header>

          {/* Buscador en vivo: actualiza ?q= al escribir/borrar. */}
          <div className="mt-8">
            <CatalogSearch placeholder="Buscar por tema, rol o impacto" />
          </div>

          {/* Chips de habilidad: "Todos" fijo y el resto en scroll horizontal. */}
          <div className="mt-4">
            <ChipScroller
              pinned={
                <Link
                  href={hrefCon({ skill: undefined })}
                  className={chip(!filters.skill)}
                >
                  Todos
                </Link>
              }
            >
              {skills.map((s) => (
                <Link
                  key={s}
                  href={hrefCon({ skill: s })}
                  className={chip(filters.skill === s)}
                >
                  {s}
                </Link>
              ))}
            </ChipScroller>
          </div>

          {/* Chips de modalidad: "Cualquier modalidad" fijo y el resto en scroll. */}
          <div className="mt-2">
            <ChipScroller
              pinned={
                <Link
                  href={hrefCon({ modalidad: undefined })}
                  className={chip(!filters.modalidad)}
                >
                  Cualquier modalidad
                </Link>
              }
            >
              {MODALIDADES.map((m) => (
                <Link
                  key={m.value}
                  href={hrefCon({ modalidad: m.value })}
                  className={chip(filters.modalidad === m.value)}
                >
                  {m.label}
                </Link>
              ))}
            </ChipScroller>
          </div>

          {/* Conteo + limpiar filtros */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <p className="text-lg font-semibold text-ink">
              {total} {total === 1 ? "oportunidad abierta" : "oportunidades abiertas"}
            </p>
            {filtrando && (
              <Link
                href="/proyectos"
                className="text-sm font-medium text-electric hover:underline"
              >
                Limpiar filtros
              </Link>
            )}
          </div>

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
            <>
              <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </section>
              <Pagination
                page={page}
                totalPages={totalPages}
                hrefForPage={hrefForPage}
                label="Paginación del catálogo"
              />
            </>
          )}
        </div>
      </main>

      <RevealFooter>
        <SiteFooter />
      </RevealFooter>
    </>
  );
}
