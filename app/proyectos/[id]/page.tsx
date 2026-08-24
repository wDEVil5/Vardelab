import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import {
  getPublishedProjectById,
  type ProjectDetail,
} from "@/features/projects/queries";
import { getCurrentUser } from "@/features/auth/queries";
import { getMyApplicationRoleIds } from "@/features/applications/queries";

// Etiquetas legibles de los enums para la interfaz.
const MODALIDAD_LABEL: Record<string, string> = {
  remoto: "Remoto",
  presencial: "Presencial",
  hibrido: "Híbrido",
};
const NIVEL_LABEL: Record<string, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

type PageProps = { params: Promise<{ id: string }> };

// Título de pestaña dinámico según el proyecto (o genérico si no existe).
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getPublishedProjectById(id);
  if (!project) return { title: "Proyecto no encontrado · CampusLab" };
  return {
    title: `${project.titulo} · CampusLab`,
    description: project.resumen ?? undefined,
  };
}

/**
 * P-03 · Ficha pública de un proyecto.
 * Server Component: resuelve la ficha en el servidor; si no existe o no está
 * publicado, `getPublishedProjectById` devuelve null y se muestra 404.
 */
export default async function ProyectoPage({ params }: PageProps) {
  const { id } = await params;
  const project = await getPublishedProjectById(id);

  if (!project) notFound();

  const user = await getCurrentUser();
  const org = project.organization;
  const roles = project.roles ?? [];

  // Roles a los que el usuario ya postuló, para marcar el estado en cada CTA.
  const appliedRoleIds = user
    ? await getMyApplicationRoleIds(roles.map((r) => r.id))
    : new Set<string>();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      {/* Volver al catálogo */}
      <Link
        href="/proyectos"
        className="text-sm text-muted transition-colors hover:text-electric"
      >
        ← Volver a proyectos
      </Link>

      {/* Encabezado */}
      <header className="mt-6 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted">{org?.nombre}</span>
          {org?.verificacion === "verificado" && (
            <Badge tone="success">Verificada</Badge>
          )}
        </div>

        <h1 className="text-3xl font-bold text-ink">{project.titulo}</h1>

        {project.resumen && <p className="text-muted">{project.resumen}</p>}

        <div className="flex flex-wrap items-center gap-2">
          {project.modalidad && (
            <Badge tone="brand">
              {MODALIDAD_LABEL[project.modalidad] ?? project.modalidad}
            </Badge>
          )}
          {project.duracion_semanas && (
            <Badge>{project.duracion_semanas} semanas</Badge>
          )}
        </div>
      </header>

      {/* Plantilla del proyecto */}
      <div className="mt-10 flex flex-col gap-8">
        <Section titulo="El problema" contenido={project.problema} />
        <Section titulo="Alcance" contenido={project.alcance} />
        <Section titulo="Entregable" contenido={project.entregable} />
        <Section titulo="Expectativas" contenido={project.expectativas} />
      </div>

      {/* Roles */}
      {roles.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-ink">Roles disponibles</h2>
          <div className="mt-4 flex flex-col gap-4">
            {roles.map((rol) => (
              <RoleCard
                key={rol.id}
                rol={rol}
                projectId={project.id}
                isAuthenticated={Boolean(user)}
                yaPostulo={appliedRoleIds.has(rol.id)}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------

/** Bloque de la plantilla; no se muestra si el campo viene vacío. */
function Section({
  titulo,
  contenido,
}: {
  titulo: string;
  contenido: string | null;
}) {
  if (!contenido) return null;
  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="text-lg font-semibold text-ink">{titulo}</h2>
      <p className="whitespace-pre-line text-muted">{contenido}</p>
    </section>
  );
}

/** Tarjeta de un rol con sus habilidades exigidas y el CTA de postulación. */
function RoleCard({
  rol,
  projectId,
  isAuthenticated,
  yaPostulo,
}: {
  rol: ProjectDetail["roles"][number];
  projectId: string;
  isAuthenticated: boolean;
  yaPostulo: boolean;
}) {
  const skills = rol.skills ?? [];
  return (
    <article className="rounded-lg border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-ink">{rol.nombre}</h3>
          {rol.descripcion && (
            <p className="text-sm text-muted">{rol.descripcion}</p>
          )}
        </div>
        <Badge>
          {rol.cupos} {rol.cupos === 1 ? "cupo" : "cupos"}
        </Badge>
      </div>

      {skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <Badge key={s.skill?.id ?? s.nivel_minimo} tone="outline">
              {s.skill?.nombre}
              {s.nivel_minimo && (
                <span className="text-muted/70">
                  · {NIVEL_LABEL[s.nivel_minimo] ?? s.nivel_minimo}
                </span>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* CTA según el estado: sin sesión → Ingresar; ya postuló → aviso; con
          sesión y sin postular → enlace al formulario de postulación (E-03). */}
      <div className="mt-5">
        {!isAuthenticated ? (
          <Link
            href="/ingresar"
            className={buttonClasses({ variant: "primary", size: "sm" })}
          >
            Ingresar para postular
          </Link>
        ) : yaPostulo ? (
          <Badge tone="success">Ya postulaste</Badge>
        ) : (
          <Link
            href={`/proyectos/${projectId}/postular/${rol.id}`}
            className={buttonClasses({ variant: "primary", size: "sm" })}
          >
            Postular a este rol
          </Link>
        )}
      </div>
    </article>
  );
}
