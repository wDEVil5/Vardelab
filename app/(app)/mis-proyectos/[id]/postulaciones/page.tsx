import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/features/auth/queries";
import {
  getProjectApplications,
  type ProjectApplications,
} from "@/features/applications/queries";
import {
  AcceptApplicationButton,
  RejectApplicationButton,
} from "@/features/applications/components/accept-application-button";
import { ConfirmTeamButton } from "@/features/applications/components/confirm-team-button";
import { RemoveTeamMemberButton } from "@/features/applications/components/remove-team-member-button";

export const metadata: Metadata = {
  title: "Seleccionar equipo · Vardelab",
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
  removida: { label: "Quitada del equipo", tone: "neutral" },
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
    <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:py-10">
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

      <div className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-border bg-white p-6">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate font-semibold text-ink">{project.titulo}</span>
          <span className="truncate text-xs text-muted">{detalle}</span>
        </div>
        <Badge tone={estado.tone} className="shrink-0">
          {estado.label}
        </Badge>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="rounded-2xl border border-border bg-white p-8">
          <h2 className="text-lg font-semibold text-ink">Postulaciones</h2>
          <div className="mt-5 flex flex-col gap-8">
            {roles.map((rol) => (
              <RoleApplications key={rol.id} rol={rol} projectId={id} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5 rounded-2xl border border-border bg-white p-6 lg:sticky lg:top-8">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-ink">Equipo actual</span>
            <span className="shrink-0 text-xs text-muted">
              {project.equipo.length}/{cuposTotales}
            </span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-electric transition-[width]"
              style={{
                width: `${cuposTotales > 0 ? Math.min(100, Math.round((project.equipo.length / cuposTotales) * 100)) : 0}%`,
              }}
            />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {roles.map((r) => {
              const aceptadas = (r.applications ?? []).filter(
                (a) => a.status === "aceptada",
              ).length;
              return (
                <span
                  key={r.id}
                  className="flex max-w-full items-center gap-1.5 text-xs text-muted"
                >
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      aceptadas >= r.cupos
                        ? "bg-sprout"
                        : aceptadas > 0
                          ? "bg-electric"
                          : "bg-border",
                    )}
                  />
                  <span className="truncate">{r.nombre}</span>
                  <span className="shrink-0">
                    {aceptadas}/{r.cupos}
                  </span>
                </span>
              );
            })}
          </div>

          {project.equipo.length === 0 ? (
            <p className="text-sm text-muted">
              Todavía no seleccionaste a nadie.
            </p>
          ) : (
            <ul className="-mr-1 flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
              {project.equipo.map((m) => (
                <li key={m.teamMemberId} className="flex min-w-0 items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-electric/10 text-xs font-semibold text-electric">
                    {iniciales(m.nombre)}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="truncate text-sm font-medium text-ink">
                      {m.nombre ?? "Estudiante"}
                    </span>
                    {(m.roleNombre || m.carrera) && (
                      <span className="truncate text-xs text-muted">
                        {[m.roleNombre, m.carrera].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </div>
                  <RemoveTeamMemberButton
                    teamMemberId={m.teamMemberId}
                    projectId={id}
                    userId={m.userId}
                    nombre={m.nombre ?? "este integrante"}
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-border pt-4">
            <ConfirmTeamButton
              projectId={id}
              puedeConfirmar={project.status === "seleccion" && project.equipo.length > 0}
              yaConfirmado={project.status === "activo"}
              rolesSinCubrir={roles
                .filter(
                  (r) =>
                    (r.applications ?? []).filter((a) => a.status === "aceptada")
                      .length < r.cupos,
                )
                .map((r) => r.nombre)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

// Ícono de flecha diagonal, para el acceso directo al perfil de un
// postulante o integrante (mismo ícono que ya usa `/u/[id]` para un enlace
// de evidencia — lee como "ver más", no como "seguir a lo siguiente").
function IconFlecha({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

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
                className="flex flex-col gap-4 rounded-lg border border-border bg-white p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-electric/10 text-xs font-semibold text-electric">
                    {iniciales(app.applicant?.nombre ?? null)}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-ink">
                        {app.applicant?.nombre ?? "Postulante"}
                      </span>
                      {app.applicant && (
                        // Ícono, no el nombre como enlace: quien gestiona
                        // este rol ya tiene permiso de ver el perfil completo
                        // por RLS (`profiles_select_managed_applicant`, M13)
                        // sea público o no, así que siempre lleva a alguna
                        // parte — pero un nombre-enlace se leía como si fuera
                        // el título de la tarjeta en vez de una acción aparte.
                        <Link
                          href={`/u/${app.applicant.id}`}
                          aria-label="Ver perfil"
                          title="Ver perfil"
                          className="flex size-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-electric/10 hover:text-electric"
                        >
                          <IconFlecha className="size-3.5" />
                        </Link>
                      )}
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                    </div>
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

                {app.status === "enviada" &&
                  (cuposLlenos ? (
                    <span className="text-xs text-muted sm:shrink-0 sm:self-center">
                      Cupos completos
                    </span>
                  ) : (
                    <div className="flex flex-col gap-2 sm:w-32 sm:shrink-0 sm:self-center">
                      <AcceptApplicationButton applicationId={app.id} projectId={projectId} />
                      <RejectApplicationButton applicationId={app.id} projectId={projectId} />
                    </div>
                  ))}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
