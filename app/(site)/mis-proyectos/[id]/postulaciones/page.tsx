import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/queries";
import {
  getProjectApplications,
  type ProjectApplications,
} from "@/features/applications/queries";
import {
  acceptApplication,
  rejectApplication,
} from "@/features/applications/actions";

export const metadata: Metadata = {
  title: "Postulaciones · CampusLab",
};

const ESTADO: Record<string, { label: string; tone: BadgeTone }> = {
  enviada: { label: "Enviada", tone: "brand" },
  aceptada: { label: "Aceptada", tone: "success" },
  rechazada: { label: "Rechazada", tone: "danger" },
  retirada: { label: "Retirada", tone: "neutral" },
};

type PageProps = { params: Promise<{ id: string }> };

/** Revisión de postulaciones de un proyecto por su patrocinador. */
export default async function PostulacionesProyectoPage({ params }: PageProps) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/ingresar?next=/mis-proyectos/${id}/postulaciones`);

  const project = await getProjectApplications(id);
  if (!project) notFound();

  const roles = project.roles ?? [];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link
        href={`/mis-proyectos/${id}`}
        className="text-sm text-muted transition-colors hover:text-electric"
      >
        ← Volver al proyecto
      </Link>

      <header className="mt-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink">Postulaciones</h1>
        <p className="text-sm text-muted">{project.titulo}</p>
      </header>

      <div className="mt-8 flex flex-col gap-8">
        {roles.map((rol) => (
          <RoleApplications key={rol.id} rol={rol} projectId={id} />
        ))}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------

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
        <h2 className="text-lg font-semibold text-ink">{rol.nombre}</h2>
        <span className="text-sm text-muted">
          {aceptadas}/{rol.cupos} {rol.cupos === 1 ? "cupo" : "cupos"}
        </span>
      </div>

      {apps.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Sin postulaciones todavía.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {apps.map((app) => {
            const estado = ESTADO[app.status] ?? {
              label: app.status,
              tone: "neutral" as BadgeTone,
            };
            return (
              <li
                key={app.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-ink">
                      {app.applicant?.nombre ?? "Postulante"}
                    </span>
                    {app.applicant?.carrera && (
                      <span className="text-xs text-muted">
                        {app.applicant.carrera}
                      </span>
                    )}
                  </div>
                  <Badge tone={estado.tone}>{estado.label}</Badge>
                </div>

                {app.mensaje && (
                  <p className="text-sm text-muted">{app.mensaje}</p>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-muted">
                  {app.disponibilidad && (
                    <span>Disponibilidad: {app.disponibilidad}</span>
                  )}
                  {app.evidencia && (
                    <a
                      href={app.evidencia}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-electric hover:underline"
                    >
                      Ver evidencia
                    </a>
                  )}
                </div>

                {/* Acciones solo para postulaciones pendientes */}
                {app.status === "enviada" && (
                  <div className="flex items-center gap-2 border-t border-border pt-3">
                    {/* Aceptar solo si quedan cupos (la guarda de servidor es la barrera real). */}
                    {cuposLlenos ? (
                      <span className="text-xs text-muted">Cupos completos</span>
                    ) : (
                      <form action={acceptApplication}>
                        <input type="hidden" name="applicationId" value={app.id} />
                        <input type="hidden" name="projectId" value={projectId} />
                        <button
                          type="submit"
                          className={buttonClasses({
                            variant: "primary",
                            size: "sm",
                          })}
                        >
                          Aceptar
                        </button>
                      </form>
                    )}
                    <form action={rejectApplication}>
                      <input type="hidden" name="applicationId" value={app.id} />
                      <input type="hidden" name="projectId" value={projectId} />
                      <button
                        type="submit"
                        className={buttonClasses({
                          variant: "ghost",
                          size: "sm",
                        })}
                      >
                        Rechazar
                      </button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
