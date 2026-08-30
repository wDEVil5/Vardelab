import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { cn } from "@/lib/utils";
import {
  getPublishedProjectById,
  type ProjectDetail,
} from "@/features/projects/queries";
import { getCurrentUser } from "@/features/auth/queries";
import {
  getMyActiveApplicationInProject,
  type MyProjectApplication,
} from "@/features/applications/queries";

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

  // Postulación activa del usuario en este proyecto (si la hay). Regla: a lo
  // sumo un rol por proyecto, así que si existe, el resto de roles no ofrece
  // postular y el rol postulado muestra su estado.
  const miPostulacion = user
    ? await getMyActiveApplicationInProject(project.id)
    : null;

  // Cupos totales (suma de los roles) para el estado del proyecto.
  const cuposTotales = roles.reduce((total, rol) => total + rol.cupos, 0);

  return (
    <main className="flex-1 bg-surface">
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        {/* Volver al catálogo */}
        <Link
          href="/proyectos"
          className="text-sm text-muted transition-colors hover:text-electric"
        >
          ← Volver a proyectos
        </Link>

        {/* Encabezado */}
        <header className="mt-6 flex flex-col gap-2">
          <span className="text-sm font-medium text-muted">
            Detalle de proyecto
          </span>
          <h1 className="text-3xl font-bold text-ink sm:text-4xl">
            {project.titulo}
          </h1>
          {org?.nombre && (
            <span className="flex items-center gap-1.5 text-muted">
              {org.nombre}
              {org.verificacion === "verificado" && <VerifiedBadge />}
            </span>
          )}
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Contenido principal */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="flex flex-col gap-8 rounded-2xl border border-border bg-white p-6 sm:p-8">
              {project.resumen && (
                <p className="text-lg text-muted">{project.resumen}</p>
              )}
              <Section titulo="El desafío" contenido={project.problema} />
              <Section titulo="Alcance" contenido={project.alcance} />
              <Section titulo="Entregable" contenido={project.entregable} />
              <Section titulo="Expectativas" contenido={project.expectativas} />
            </div>

            {/* Roles */}
            {roles.length > 0 && (
              <section id="roles" className="scroll-mt-6">
                <h2 className="text-xl font-semibold text-ink">
                  Roles disponibles
                </h2>
                <div className="mt-4 flex flex-col gap-4">
                  {roles.map((rol) => (
                    <RoleCard
                      key={rol.id}
                      rol={rol}
                      projectId={project.id}
                      isAuthenticated={Boolean(user)}
                      miPostulacion={miPostulacion}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Tarjeta lateral: estado, compromiso y CTA a los roles. */}
          <aside className="lg:col-span-1">
            <div className="sticky top-6 flex flex-col gap-4 rounded-2xl border border-border bg-white p-6">
              <span className="font-semibold text-sprout">
                Abierto{cuposTotales > 0 && ` · ${cuposTotales} ${cuposTotales === 1 ? "cupo" : "cupos"}`}
              </span>
              <p className="text-sm text-muted">
                Tu rol puede generar evidencia real para tu portafolio.
              </p>

              {/* Compromiso: duración, modalidad y tamaño del equipo. */}
              <div className="flex flex-wrap gap-2">
                {project.duracion_semanas && (
                  <Badge>{project.duracion_semanas} semanas</Badge>
                )}
                {project.modalidad && (
                  <Badge tone="brand">
                    {MODALIDAD_LABEL[project.modalidad] ?? project.modalidad}
                  </Badge>
                )}
                {cuposTotales > 0 && (
                  <Badge tone="outline">Equipo de {cuposTotales}</Badge>
                )}
              </div>

              {roles.length > 0 && (
                <a
                  href="#roles"
                  className={cn(buttonClasses({ variant: "primary" }), "w-full")}
                >
                  Postular a un rol
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>
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

// Estado de la postulación activa → etiqueta para el rol postulado.
const ESTADO_ROL: Record<string, string> = {
  enviada: "Ya postulaste a este rol",
  aceptada: "Aceptado en este rol",
};

/** Tarjeta de un rol con sus habilidades exigidas y el CTA de postulación. */
function RoleCard({
  rol,
  projectId,
  isAuthenticated,
  miPostulacion,
}: {
  rol: ProjectDetail["roles"][number];
  projectId: string;
  isAuthenticated: boolean;
  miPostulacion: MyProjectApplication | null;
}) {
  const skills = rol.skills ?? [];
  // ¿Este rol es al que postulé, o postulé a otro del mismo proyecto?
  const esMiRol = miPostulacion?.roleId === rol.id;
  const tieneOtra = Boolean(miPostulacion) && !esMiRol;
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

      {/* CTA según el estado. La regla es un rol por proyecto: si ya hay una
          postulación activa, el rol postulado muestra su estado y el resto
          queda deshabilitado. Sin sesión → Ingresar; libre → formulario (E-03). */}
      <div className="mt-5">
        {!isAuthenticated ? (
          <Link
            href="/ingresar"
            className={buttonClasses({ variant: "primary", size: "sm" })}
          >
            Ingresar para postular
          </Link>
        ) : esMiRol ? (
          <Badge tone="success">
            {ESTADO_ROL[miPostulacion!.status] ?? "Ya postulaste a este rol"}
          </Badge>
        ) : tieneOtra ? (
          <p className="text-sm text-muted">
            Ya tienes una postulación activa en este proyecto.
          </p>
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
