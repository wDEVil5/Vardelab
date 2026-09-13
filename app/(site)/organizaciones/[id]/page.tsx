import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrgLogo } from "@/components/ui/org-logo";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { OrgProjectsGrid } from "@/features/organizations/components/org-projects-grid";
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

function IconGlobo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
    </svg>
  );
}

function IconPersona({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

function IconSobre({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
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
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <header className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border bg-white">
        {/* Banda de marca: le da a la ficha un punto focal de color antes del
            contenido en blanco y negro, sin depender de que la organización
            tenga una foto de portada (no existe ese campo). */}
        <div className="h-20 bg-linear-to-br from-electric/15 to-electric/5 sm:h-24" />

        <div className="flex flex-col items-center px-6 pb-8 text-center sm:px-10">
          <div className="-mt-10 rounded-2xl ring-4 ring-white sm:-mt-12">
            <OrgLogo logoUrl={org.logo_url} nombre={org.nombre} size="lg" />
          </div>

          <h1 className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-2xl font-bold text-ink">
            {org.nombre}
            {org.verificacion === "verificado" && <VerifiedBadge />}
          </h1>
          <p className="text-sm text-muted">{TIPO_LABEL[org.tipo] ?? org.tipo}</p>

          {org.descripcion && (
            <p className="mt-4 max-w-md text-muted">{org.descripcion}</p>
          )}

          {(org.sitio_web || org.contacto || org.contacto_email) && (
            <div className="mt-6 flex flex-col items-center gap-2 border-t border-border pt-6 text-sm">
              {org.sitio_web && (
                <a
                  href={org.sitio_web}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-medium text-electric hover:underline"
                >
                  <IconGlobo className="size-4 shrink-0" />
                  {org.sitio_web}
                </a>
              )}
              {org.contacto && (
                <span className="flex items-center gap-1.5 text-ink">
                  <IconPersona className="size-4 shrink-0 text-muted" />
                  {org.contacto}
                </span>
              )}
              {org.contacto_email && (
                <a
                  href={`mailto:${org.contacto_email}`}
                  className="flex items-center gap-1.5 text-electric hover:underline"
                >
                  <IconSobre className="size-4 shrink-0" />
                  {org.contacto_email}
                </a>
              )}
            </div>
          )}
        </div>
      </header>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-ink">
          Proyectos publicados
          {proyectos.length > 0 && (
            <span className="ml-1.5 font-normal text-muted">({proyectos.length})</span>
          )}
        </h2>
        {proyectos.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center">
            <p className="text-sm text-muted">Todavía no tiene proyectos publicados.</p>
          </div>
        ) : (
          <div className="mt-4">
            <OrgProjectsGrid proyectos={proyectos} />
          </div>
        )}
      </section>
    </main>
  );
}
