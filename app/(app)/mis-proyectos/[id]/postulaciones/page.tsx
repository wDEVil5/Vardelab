import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { getCurrentUser } from "@/features/auth/queries";
import {
  getProjectApplications,
  type ProjectApplications,
} from "@/features/applications/queries";
import { acceptApplication, rejectApplication } from "@/features/applications/actions";
import { ConfirmTeamButton } from "@/features/applications/components/confirm-team-button";

export const metadata: Metadata = {
  title: "Seleccionar equipo · CampusLab",
};

const ESTADO_PROYECTO: Record<string, { label: string; tone: BadgeTone }> = {
  borrador: { label: "Borrador", tone: "neutral" },
  en_revision: { label: "En revisión", tone: "brand" },
  publicado: { label: "Publicado", tone: "success" },
  seleccion: { label: "En selección", tone: "brand" },
  activo: { label: "Activo", tone: "success" },
  revision_final: { label: "Revisión final", tone: "brand" },
  completado: { label: "Completado", tone: "success" },
  suspendido: { label: "Suspendido", tone: "danger" },
  cancelado: { label: "Cancelado", tone: "danger" },
};

const ESTADO_POSTULACION: Record<string, { label: string; tone: BadgeTone }> = {
  enviada: { label: "Enviada", tone: "brand" },
  aceptada: { label: "Aceptada", tone: "success" },
  rechazada: { label: "Rechazada", tone: "danger" },
  retirada: { label: "Retirada", tone: "neutral" },
};

const MODALIDAD_LABEL: Record<string, string> = {
  presencial: "Presencial",
  remoto: "Remoto",
  hibrido: "Híbrido",
};

type PageProps = { params: Promise<{ id: string }> };

/** Selección de equipo (S-04): revisar postulaciones por rol y formar el equipo. */
export default async function PostulacionesProyectoPage({ params }: PageProps) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/ingresar?next=/mis-proyectos/${id}/postulaciones`);

  const project = await getProjectApplications(id);
  if (!project) notFound();

  const roles = project.roles ?? [];
  const cuposTotales = roles.reduce((total, r) => total + r.cupos, 0);
  const estado = ESTADO_PROYECTO[project.status] ?? {
    label: project.status,
    tone: "neutral" as BadgeTone,
  };

  const detalle = [
    `${project.equipo.length} de ${cuposTotales} ${cuposTotales === 1 ? "cupo" : "cupos"}`,
    project.duracion_semanas ? `${project.duracion_semanas} semanas` : null,
    project.modalidad ? (MODALIDAD_LABEL[project.modalidad] ?? project.modalidad) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 lg:py-10">
      <Link
        href={`/mis-proyectos/${id}`}
        className="text-sm text-muted transition-colors hover:text-electric"
      >
        ← Volver al proyecto
      </Link>

      <header className="mt-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink">Seleccionar equipo</h1>
        <p className="text-sm text-muted">
          Revisa postulaciones por rol y forma un equipo compatible.
        </p>
      </header>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-border bg-white p-5">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-ink">{project.titulo}</span>
          <span className="text-xs text-muted">{detalle}</span>
        </div>
        <Badge tone={estado.tone}>{estado.label}</Badge>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-ink">Postulaciones</h2>
      <div className="mt-3 flex flex-col gap-6">
        {roles.map((rol) => (
          <RoleApplications key={rol.id} rol={rol} projectId={id} />
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-ink">Equipo actual</span>
          {project.equipo.length === 0 ? (
            <span className="text-sm text-muted">
              Todavía no seleccionaste a nadie.
            </span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {project.equipo.map((m) => (
                <span
                  key={m.userId}
                  className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-ink"
                >
                  {m.nombre ?? "Estudiante"}
                  {m.roleNombre ? ` · ${m.roleNombre}` : ""}
                </span>
              ))}
            </div>
          )}
        </div>
        <ConfirmTeamButton
          projectId={id}
          puedeConfirmar={project.status === "seleccion" && project.equipo.length > 0}
          yaConfirmado={project.status === "activo"}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

// Iniciales del postulante para el avatar circular: "Wilnes M." → "WM".
function iniciales(nombre: string | null): string {
  if (!nombre) return "?";
  const partes = nombre.trim().split(/\s+/);
  return partes
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function RoleApplications({
  rol,
  projectId,
}: {
  rol: ProjectApplications["roles"][number];
  projectId: string;
}) {
  const apps = rol.applications ?? [];
  const aceptadas = apps.filter((a) => a.status === "aceptada").length;
  const cuposLlenos = aceptadas >= rol.cupos;

  return (
    <section>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{rol.nombre}</h3>
        <span className="text-xs text-muted">
          {aceptadas}/{rol.cupos} {rol.cupos === 1 ? "cupo" : "cupos"}
        </span>
      </div>

      {apps.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Sin postulaciones todavía.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {apps.map((app) => {
            const recomendado = app.matchTotal > 0 && app.matchCount / app.matchTotal >= 0.5;
            const badge =
              app.status !== "enviada"
                ? (ESTADO_POSTULACION[app.status] ?? {
                    label: app.status,
                    tone: "neutral" as BadgeTone,
                  })
                : recomendado
                  ? { label: "Recomendado", tone: "success" as BadgeTone }
                  : { label: "Disponible", tone: "outline" as BadgeTone };

            const subtitulo = [
              app.applicant?.carrera,
              app.disponibilidad,
              app.matchTotal > 0 ? `${app.matchCount}/${app.matchTotal} habilidades` : null,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <li
                key={app.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-electric/10 text-xs font-semibold text-electric">
                    {iniciales(app.applicant?.nombre ?? null)}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-ink">
                      {app.applicant?.nombre ?? "Postulante"}
                    </span>
                    {subtitulo && (
                      <span className="text-xs text-muted">{subtitulo}</span>
                    )}
                    {app.mensaje && (
                      <p className="mt-1 text-sm text-muted">{app.mensaje}</p>
                    )}
                    {app.evidencia && (
                      <a
                        href={app.evidencia}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-electric hover:underline"
                      >
                        Ver evidencia
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:shrink-0">
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                  {app.status === "enviada" &&
                    (cuposLlenos ? (
                      <span className="text-xs text-muted">Cupos completos</span>
                    ) : (
                      <>
                        <form action={acceptApplication}>
                          <input type="hidden" name="applicationId" value={app.id} />
                          <input type="hidden" name="projectId" value={projectId} />
                          <SubmitButton
                            variant="primary"
                            size="sm"
                            pendingText="Seleccionando…"
                          >
                            Seleccionar
                          </SubmitButton>
                        </form>
                        <form action={rejectApplication}>
                          <input type="hidden" name="applicationId" value={app.id} />
                          <input type="hidden" name="projectId" value={projectId} />
                          <SubmitButton
                            variant="ghost"
                            size="sm"
                            pendingText="Rechazando…"
                          >
                            Rechazar
                          </SubmitButton>
                        </form>
                      </>
                    ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
