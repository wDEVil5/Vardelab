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
import { esAptoSinExperiencia } from "@/features/projects/roles";
import { getCurrentUser } from "@/features/auth/queries";
import { ReportButton } from "@/features/reports/components/report-button";
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
  const titulo = `${project.titulo} · CampusLab`;
  return {
    title: titulo,
    description: project.resumen ?? undefined,
    openGraph: { title: titulo, description: project.resumen ?? undefined },
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

  // Rango de dedicación semanal entre los roles, para el resumen del panel
  // lateral (RF: "4 semanas" de duración no dice cuánto tiempo por semana).
  // Es un dato por rol, no por proyecto, así que se muestra como rango.
  const horasSemanales = roles
    .map((r) => r.horas_semanales)
    .filter((h): h is number => h != null);
  const horasMin = horasSemanales.length ? Math.min(...horasSemanales) : null;
  const horasMax = horasSemanales.length ? Math.max(...horasSemanales) : null;

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
              {project.entregable && (
                <section className="flex flex-col gap-1.5 rounded-xl border border-electric/20 bg-electric/5 p-5">
                  <h2 className="text-lg font-semibold text-ink">Entregable</h2>
                  <p className="whitespace-pre-line text-ink">
                    {project.entregable}
                  </p>
                </section>
              )}
              <Section titulo="Expectativas" contenido={project.expectativas} />
            </div>

            {/* Condiciones del proyecto: señales de confianza para ambas partes. */}
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-ink">
                Condiciones del proyecto
              </h2>
              <ul className="flex flex-col gap-3 text-sm">
                {project.revisado_at && (
                  <Condicion
                    titulo="Revisado por CampusLab."
                    texto="El alcance del proyecto se revisó antes de publicarse."
                  />
                )}
                <Condicion
                  titulo="Acompañamiento por hitos."
                  texto="La organización sigue el avance y valida las entregas por etapas."
                />
                {project.duracion_semanas && (
                  <Condicion
                    titulo={`Plazo estimado: ${project.duracion_semanas} semanas.`}
                    texto="Definido al publicar, para expectativas claras de tiempo."
                  />
                )}
                <Condicion
                  titulo="Portafolio y confidencialidad."
                  texto="El resultado puede sumarse al portafolio del estudiante, salvo acuerdo distinto; la confidencialidad se coordina entre las partes antes de comenzar."
                />
              </ul>
              <p className="text-xs text-muted">
                Condiciones orientativas del piloto; no constituyen un contrato.
              </p>
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
                      miPostulacion={miPostulacion}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Tarjeta lateral: estado, compromiso y CTA a los roles. */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 flex flex-col gap-4 rounded-2xl border border-border bg-white p-6">
              <span className="font-semibold text-sprout">
                Abierto{cuposTotales > 0 && ` · ${cuposTotales} ${cuposTotales === 1 ? "cupo" : "cupos"}`}
              </span>
              <p className="text-sm text-muted">
                Tu rol puede generar evidencia real para tu portafolio.
              </p>

              {/* Compromiso: duración, dedicación semanal, modalidad y equipo. */}
              <div className="flex flex-wrap gap-2">
                {project.duracion_semanas && (
                  <Badge>{project.duracion_semanas} semanas</Badge>
                )}
                {horasMin !== null && (
                  <Badge>
                    ~{horasMin === horasMax ? horasMin : `${horasMin}–${horasMax}`} h/semana
                  </Badge>
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
                  Ver roles disponibles
                </a>
              )}
            </div>
          </aside>
        </div>

        <div className="mt-8">
          <ReportButton targetType="proyecto" targetId={project.id} />
        </div>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------

/** Ítem de "Condiciones del proyecto": check + título en foco y detalle atenuado. */
function Condicion({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <li className="flex gap-3">
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

// Máximo de habilidades visibles antes de resumir en "+N más" — con un
// proyecto de muchos roles, cada uno con varias habilidades, la lista de
// chips era lo que más alargaba la tarjeta.
const SKILLS_VISIBLES = 3;

/**
 * Tarjeta de un rol, apilada (nombre → meta → habilidades → CTA), no en fila.
 * Compacta sin cambiar de forma: la descripción y la dedicación semanal
 * comparten una sola línea, y las habilidades se resumen en unas pocas + "+N
 * más" — eso es lo que más alargaba la tarjeta con roles de muchas skills.
 */
function RoleCard({
  rol,
  projectId,
  miPostulacion,
}: {
  rol: ProjectDetail["roles"][number];
  projectId: string;
  miPostulacion: MyProjectApplication | null;
}) {
  const skills = rol.skills ?? [];
  const skillsVisibles = skills.slice(0, SKILLS_VISIBLES);
  const skillsRestantes = skills.length - skillsVisibles.length;
  // ¿Este rol es al que postulé, o postulé a otro del mismo proyecto?
  const esMiRol = miPostulacion?.roleId === rol.id;
  const tieneOtra = Boolean(miPostulacion) && !esMiRol;

  // Meta en una sola línea, unida con "·" (mismo separador que el resto del
  // panel admin) — descripción y dedicación ya no ocupan una línea cada una.
  const meta = [rol.descripcion, rol.horas_semanales && `~${rol.horas_semanales} h/semana`]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="rounded-lg border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          {/* "Apto sin experiencia" junto al nombre: es la señal que más rápido
              ayuda a autoseleccionarse, no algo para descubrir más abajo. */}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-ink">{rol.nombre}</h3>
            {esAptoSinExperiencia(skills) && (
              <span className="inline-flex items-center rounded-full bg-sprout/15 px-2.5 py-0.5 text-xs font-medium text-sprout">
                Apto sin experiencia
              </span>
            )}
          </div>
          {meta && <p className="text-sm text-muted">{meta}</p>}
        </div>
        <Badge>
          {rol.cupos} {rol.cupos === 1 ? "cupo" : "cupos"}
        </Badge>
      </div>

      {skills.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {skillsVisibles.map((s) => (
            <Badge key={s.skill?.id ?? s.nivel_minimo} tone="outline">
              {s.skill?.nombre}
              {s.nivel_minimo && (
                <span className="text-muted/70">
                  · {NIVEL_LABEL[s.nivel_minimo] ?? s.nivel_minimo}
                </span>
              )}
            </Badge>
          ))}
          {skillsRestantes > 0 && (
            <span className="text-xs text-muted">+{skillsRestantes} más</span>
          )}
        </div>
      )}

      {/* CTA según el estado. La regla es un rol por proyecto: si ya hay una
          postulación activa, el rol postulado muestra su estado y el resto
          queda deshabilitado. El botón siempre nombra el rol (no un genérico
          "Ingresar para postular"): sin sesión, la propia página de postular
          ya redirige a /ingresar con `?next=` de vuelta a este rol. */}
      <div className="mt-4">
        {esMiRol ? (
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
            Postular a {rol.nombre}
          </Link>
        )}
      </div>
    </article>
  );
}
