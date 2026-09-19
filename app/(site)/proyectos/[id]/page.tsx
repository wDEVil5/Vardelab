import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrgLogo } from "@/components/ui/org-logo";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import {
  getPublishedProjectById,
  getSimilarPublishedProjects,
} from "@/features/projects/queries";
import { ProjectCard } from "@/features/projects/components/project-card";
import { ProjectAside } from "@/features/projects/components/project-aside";
import { RoleCard } from "@/features/projects/components/role-card";
import { RolesScroller } from "@/features/projects/components/roles-scroller";
import { getCurrentUser } from "@/features/auth/queries";
import { ReportButton } from "@/features/reports/components/report-button";
import { getMyActiveApplicationInProject } from "@/features/applications/queries";
import { SiteFooter } from "@/components/site-footer";
import { RevealFooter } from "@/components/reveal-footer";
import { ActionSuccess } from "@/components/ui/action-success";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ postulado?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getPublishedProjectById(id);
  if (!project) return { title: "Proyecto no encontrado · Vardelab" };
  const titulo = `${project.titulo} · Vardelab`;
  return {
    title: titulo,
    description: project.resumen ?? undefined,
    openGraph: { title: titulo, description: project.resumen ?? undefined },
  };
}

/**
 * P-03 · Ficha pública de un proyecto.
 * Jerarquía: título + estado, CTA/aside temprano en móvil, contenido compacto,
 * roles con ancho usable (no 1/3 forzado).
 */
export default async function ProyectoPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const project = await getPublishedProjectById(id);

  if (!project) notFound();

  const user = await getCurrentUser();
  const org = project.organization;
  const roles = project.roles ?? [];

  const skillIds = Array.from(
    new Set(
      roles.flatMap((rol) =>
        (rol.skills ?? [])
          .map((s) => s.skill?.id)
          .filter((id): id is string => Boolean(id)),
      ),
    ),
  );

  const [miPostulacion, similares] = await Promise.all([
    user ? getMyActiveApplicationInProject(project.id) : Promise.resolve(null),
    getSimilarPublishedProjects({
      id: project.id,
      modalidad: project.modalidad,
      orgId: org?.id ?? null,
      skillIds,
    }),
  ]);

  const cuposTotales = roles.reduce((total, rol) => total + rol.cupos, 0);
  const cuposRestantes = roles.reduce(
    (total, rol) => total + Math.max(0, rol.cupos - rol.aceptadas),
    0,
  );

  // Estado del equipo por rol, sin nombres: mostrar quién quedó seleccionado
  // en cada proyecto crea un ranking visible al recorrer el catálogo (la
  // misma persona apareciendo "ganadora" en varios proyectos), algo que
  // puede sentirse injusto para quien postuló y no quedó. Cubiertos primero:
  // es la señal de que el proyecto ya tiene gente trabajando.
  const equipoRoles = [...roles]
    .filter((rol) => rol.aceptadas > 0)
    .sort((a, b) => {
      const cubiertoA = a.aceptadas >= a.cupos ? 1 : 0;
      const cubiertoB = b.aceptadas >= b.cupos ? 1 : 0;
      return cubiertoB - cubiertoA;
    });

  const horasSemanales = roles
    .map((r) => r.horas_semanales)
    .filter((h): h is number => h != null);
  const horasMin = horasSemanales.length ? Math.min(...horasSemanales) : null;
  const horasMax = horasSemanales.length ? Math.max(...horasSemanales) : null;

  return (
    <>
      <main className="relative z-10 md:mb-(--footer-h,0px) min-h-[calc(100dvh-3.5rem)] flex-1 bg-white md:shadow-[0_8px_24px_-16px_rgba(13,37,59,0.12)]">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6 sm:py-10">
          <Link
            href="/proyectos"
            className="group inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-electric"
          >
            <span
              aria-hidden
              className="inline-block transition-transform group-hover:-translate-x-0.5"
            >
              ←
            </span>
            Volver a proyectos
          </Link>

          <header className="mt-5 flex flex-col gap-3 sm:mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-sprout/15 px-2.5 py-0.5 text-xs font-medium text-sprout">
                Abierto
                {cuposRestantes > 0 &&
                  ` · ${cuposRestantes} ${cuposRestantes === 1 ? "cupo" : "cupos"}`}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-4xl">
              {project.titulo}
            </h1>
            {org?.nombre && (
              <Link
                href={`/organizaciones/${org.id}`}
                className="group flex w-fit items-center gap-2"
              >
                <OrgLogo logoUrl={org.logo_url} nombre={org.nombre} />
                <span className="flex items-center gap-1.5 text-sm text-muted group-hover:text-electric sm:text-base">
                  {org.nombre}
                  {org.verificacion === "verificado" && <VerifiedBadge />}
                </span>
              </Link>
            )}
            {project.resumen && (
              <p className="max-w-2xl text-base text-muted sm:text-lg">
                {project.resumen}
              </p>
            )}
          </header>

          {query?.postulado === "1" && (
            <section className="mt-6 overflow-hidden rounded-2xl border border-sprout/25 bg-sprout/5 p-4 shadow-[0_14px_32px_-24px_rgba(22,163,74,0.45)] sm:p-5">
              <ActionSuccess
                title="¡Postulación enviada!"
                description="La organización ya puede revisar tu perfil y tu mensaje. Te avisaremos cuando haya novedades."
              />
              <div className="mt-4 flex flex-col gap-2 border-t border-sprout/15 pt-4 sm:flex-row sm:items-center">
                <Link
                  href="/mis-postulaciones"
                  className="inline-flex min-h-10 items-center justify-center rounded-md bg-electric px-4 text-sm font-medium text-white transition-colors hover:bg-electric/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric"
                >
                  Ver mis postulaciones
                </Link>
                <Link
                  href="/proyectos"
                  className="inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-electric transition-colors hover:bg-electric/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric"
                >
                  Seguir explorando proyectos →
                </Link>
              </div>
            </section>
          )}

          {/* Móvil: aside (CTA) primero. Desktop: contenido | aside. */}
          <div className="mt-6 grid gap-5 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="order-1 min-w-0 lg:sticky lg:top-24 lg:order-2 lg:self-start">
              <ProjectAside
                organization={org}
                modalidad={project.modalidad}
                duracionSemanas={project.duracion_semanas}
                horasMin={horasMin}
                horasMax={horasMax}
                cuposTotales={cuposTotales}
                cuposRestantes={cuposRestantes}
                tieneRoles={roles.length > 0}
              />
            </div>

            <div className="order-2 flex min-w-0 flex-col gap-5 lg:order-1 lg:gap-6">
              <div className="flex flex-col gap-5 rounded-2xl border border-border bg-white p-5 sm:gap-6 sm:p-7">
                <Section titulo="El desafío" contenido={project.problema} />
                <Section titulo="Alcance" contenido={project.alcance} />
                {project.entregable && (
                  <section className="flex flex-col gap-1 rounded-xl border border-electric/20 bg-electric/5 px-4 py-3.5 sm:px-5 sm:py-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-electric">
                      Entregable
                    </h2>
                    <p className="whitespace-pre-line text-sm text-ink sm:text-base">
                      {project.entregable}
                    </p>
                  </section>
                )}
                <Section titulo="Expectativas" contenido={project.expectativas} />
              </div>

              {roles.length > 0 && (
                <section id="roles" className="scroll-mt-24">
                  <h2 className="text-lg font-semibold text-ink sm:text-xl">
                    Roles disponibles
                  </h2>
                  <RolesScroller>
                    {roles.map((rol) => (
                      <RoleCard
                        key={rol.id}
                        rol={rol}
                        projectId={project.id}
                        miPostulacion={miPostulacion}
                        estaAutenticado={Boolean(user)}
                      />
                    ))}
                  </RolesScroller>
                </section>
              )}

              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 sm:p-7">
                <h2 className="text-lg font-semibold text-ink sm:text-xl">
                  Condiciones del proyecto
                </h2>
                <ul className="flex flex-col gap-2.5 text-sm">
                  {project.revisado_at && (
                    <Condicion
                      titulo="Revisado por Vardelab."
                      texto="El alcance se revisó antes de publicarse."
                    />
                  )}
                  <Condicion
                    titulo="Acompañamiento por hitos."
                    texto="La organización valida el avance por etapas."
                  />
                  {project.duracion_semanas && (
                    <Condicion
                      titulo={`Plazo estimado: ${project.duracion_semanas} semanas.`}
                      texto="Definido al publicar, para expectativas claras."
                    />
                  )}
                  <Condicion
                    titulo="Portafolio y confidencialidad."
                    texto="El resultado puede ir al portafolio, salvo acuerdo distinto."
                  />
                </ul>
                <p className="text-xs text-muted">
                  Orientativas del piloto; no constituyen un contrato.
                </p>
              </div>

              {equipoRoles.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-ink sm:text-xl">
                    Equipo seleccionado
                  </h2>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {equipoRoles.map((rol) => {
                      const cubierto = rol.aceptadas >= rol.cupos;
                      return (
                        <li
                          key={rol.id}
                          className="inline-flex shrink-0 items-center whitespace-nowrap rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted"
                        >
                          {rol.nombre}
                          <span className="text-muted/70">
                            {" · "}
                            {cubierto ? "Cubierto" : `${rol.aceptadas} de ${rol.cupos}`}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

            </div>
          </div>

          {similares.length > 0 && (
            <section className="mt-10 border-t border-border pt-10 sm:mt-12 sm:pt-12">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink sm:text-xl">
                  Proyectos similares
                </h2>
                <Link
                  href="/proyectos"
                  className="group inline-flex items-center gap-1 text-sm font-medium text-electric transition-colors hover:text-electric/80"
                >
                  Ver catálogo
                  <span
                    aria-hidden
                    className="inline-block transition-transform group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {similares.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          )}

          <div className="mt-10 border-t border-border pt-8">
            <ReportButton targetType="proyecto" targetId={project.id} />
          </div>
        </div>
      </main>

      <RevealFooter>
        <SiteFooter />
      </RevealFooter>
    </>
  );
}

function Condicion({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <li className="flex gap-2.5">
      <svg
        viewBox="0 0 24 24"
        className="mt-0.5 size-4 shrink-0 text-sprout"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
      <span>
        <span className="font-medium text-ink">{titulo}</span>{" "}
        <span className="text-muted">{texto}</span>
      </span>
    </li>
  );
}

function Section({
  titulo,
  contenido,
}: {
  titulo: string;
  contenido: string | null;
}) {
  if (!contenido) return null;
  return (
    <section className="flex flex-col gap-1 border-b border-border pb-5 last:border-b-0 last:pb-0">
      <h2 className="text-base font-semibold text-ink sm:text-lg">{titulo}</h2>
      <p className="whitespace-pre-line text-sm leading-relaxed text-muted sm:text-base">
        {contenido}
      </p>
    </section>
  );
}
