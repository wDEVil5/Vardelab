import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrgLogo } from "@/components/ui/org-logo";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { ProjectCard } from "@/features/projects/components/project-card";
import { getPublicOrganization } from "@/features/organizations/queries";
import { getPublishedProjectsByOrg } from "@/features/projects/queries";

type PageProps = { params: Promise<{ id: string }> };

const TIPO_LABEL: Record<string, string> = {
  academica: "Académica",
  social: "Social",
  emprendimiento: "Emprendimiento",
  empresa: "Empresa",
  interna: "Interna",
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const org = await getPublicOrganization(id);
  if (!org) return { title: "Organización no encontrada · CampusLab" };
  const titulo = `${org.nombre} · CampusLab`;
  return {
    title: titulo,
    description: org.descripcion ?? undefined,
    openGraph: { title: titulo, description: org.descripcion ?? undefined },
  };
}

/**
 * Perfil público de una organización: lo que un estudiante ve antes de
 * postular a uno de sus proyectos (identidad, verificación, contacto y sus
 * proyectos publicados). Análogo a `/u/[id]` para el estudiante, pero sin
 * columna de visibilidad — toda organización es pública desde que se crea
 * (`getPublicOrganization` solo la busca por id) → 404 si no existe.
 */
export default async function PerfilOrganizacionPage({ params }: PageProps) {
  const { id } = await params;
  const [org, proyectos] = await Promise.all([
    getPublicOrganization(id),
    getPublishedProjectsByOrg(id),
  ]);
  if (!org) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <header className="flex flex-col gap-5 rounded-2xl border border-border bg-white p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-4">
          <OrgLogo logoUrl={org.logo_url} nombre={org.nombre} size="lg" />
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-1.5 truncate text-2xl font-bold text-ink">
              {org.nombre}
              {org.verificacion === "verificado" && <VerifiedBadge />}
            </h1>
            <p className="text-sm text-muted">
              {TIPO_LABEL[org.tipo] ?? org.tipo}
            </p>
          </div>
        </div>

        {org.descripcion && <p className="text-muted">{org.descripcion}</p>}

        {(org.sitio_web || org.contacto || org.contacto_email) && (
          <div className="flex flex-col gap-1.5 border-t border-border pt-5 text-sm">
            {org.sitio_web && (
              <a
                href={org.sitio_web}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-electric hover:underline"
              >
                {org.sitio_web}
              </a>
            )}
            {org.contacto && (
              <p className="text-ink">
                Contacto: <span className="text-muted">{org.contacto}</span>
              </p>
            )}
            {org.contacto_email && (
              <a
                href={`mailto:${org.contacto_email}`}
                className="text-electric hover:underline"
              >
                {org.contacto_email}
              </a>
            )}
          </div>
        )}
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink">
          Proyectos publicados
        </h2>
        {proyectos.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Todavía no tiene proyectos publicados.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {proyectos.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
