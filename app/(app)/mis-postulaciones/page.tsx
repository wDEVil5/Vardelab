import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/features/auth/queries";
import {
  getMyApplications,
  type MyApplication,
} from "@/features/applications/queries";
import { withdrawApplication } from "@/features/applications/actions";
import { getMyTeams } from "@/features/teams/queries";
import { getMilestonesWithSubmissions } from "@/features/milestones/queries";
import { MilestoneSubmissions } from "@/features/submissions/components/milestone-submissions";
import { getMyEvaluationsByProject } from "@/features/evaluations/queries";

export const metadata: Metadata = {
  title: "Mis postulaciones · CampusLab",
};

// Estado de la postulación → etiqueta y tono del badge.
const ESTADO: Record<string, { label: string; tone: BadgeTone }> = {
  enviada: { label: "Enviada", tone: "brand" },
  aceptada: { label: "Aceptada", tone: "success" },
  rechazada: { label: "Rechazada", tone: "danger" },
  retirada: { label: "Retirada", tone: "neutral" },
};

/**
 * S-04 · Panel del estudiante: sus postulaciones, organizadas por etapa del
 * ciclo de vida (de más a menos accionable): "En curso" (donde lo seleccionaron,
 * con hitos), "En revisión" (esperando respuesta) y "Cerradas" (plegadas). Las
 * aceptadas no se repiten en las listas: se muestran como equipos en "En curso".
 * Requiere sesión.
 */
export default async function MisPostulacionesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?next=/mis-postulaciones");

  const [postulaciones, equipos, evaluaciones] = await Promise.all([
    getMyApplications(),
    getMyTeams(),
    getMyEvaluationsByProject(),
  ]);

  // Hitos (con entregas) de cada proyecto en el que el estudiante tiene equipo.
  const equiposConHitos = await Promise.all(
    equipos.map(async (eq) => ({
      ...eq,
      hitos: eq.projectId
        ? await getMilestonesWithSubmissions(eq.projectId)
        : [],
    })),
  );

  // Agrupación por etapa. Las aceptadas se ven como equipos (arriba), no en las
  // listas, para no duplicar el mismo proyecto.
  const enRevision = postulaciones.filter((p) => p.status === "enviada");
  const cerradas = postulaciones.filter(
    (p) => p.status === "rechazada" || p.status === "retirada",
  );

  const vacio = postulaciones.length === 0 && equiposConHitos.length === 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8 lg:py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Mis postulaciones</h1>
        <p className="text-sm text-muted">En qué anda cada una.</p>
      </header>

      {vacio ? (
        <div className="mt-8 rounded-lg border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <p className="font-medium text-ink">Todavía no postulaste a nada</p>
          <p className="mt-1 text-sm text-muted">
            Explora el catálogo y postula al rol que se ajuste a lo que sabes
            hacer.
          </p>
          <Link
            href="/proyectos"
            className={cn(
              "mt-4 inline-flex",
              buttonClasses({ variant: "primary", size: "sm" }),
            )}
          >
            Ver proyectos
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-10">
          {/* 1 · En curso: donde te seleccionaron (equipos + hitos). */}
          {equiposConHitos.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-ink">En curso</h2>
              <p className="mt-0.5 text-sm text-muted">
                Proyectos donde te seleccionaron.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                {equiposConHitos.map((eq) => (
                  <div
                    key={eq.teamId}
                    className="rounded-lg border border-border bg-white p-5"
                  >
                    <Link
                      href={`/proyectos/${eq.projectId}`}
                      className="font-semibold text-ink hover:text-electric"
                    >
                      {eq.projectTitulo}
                    </Link>

                    {/* Integrantes */}
                    <ul className="mt-3 flex flex-col gap-1.5">
                      {eq.members.map((m) => (
                        <li
                          key={m.userId}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="text-ink">
                            {m.nombre}
                            {m.esYo && <span className="text-muted"> (tú)</span>}
                          </span>
                          {m.rol && <Badge tone="outline">{m.rol}</Badge>}
                        </li>
                      ))}
                    </ul>

                    {/* Evaluación del gestor (privada, solo la ve el estudiante) */}
                    {eq.projectId &&
                      evaluaciones.get(eq.projectId)?.puntaje != null && (
                        <div className="mt-4 rounded-lg border border-border bg-surface/50 p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-ink">
                              Tu evaluación
                            </span>
                            <Badge tone="brand">
                              {evaluaciones.get(eq.projectId)!.puntaje} / 5
                            </Badge>
                          </div>
                          {evaluaciones.get(eq.projectId)!.comentario && (
                            <p className="mt-1 text-sm text-muted">
                              {evaluaciones.get(eq.projectId)!.comentario}
                            </p>
                          )}
                        </div>
                      )}

                    {/* Hitos y entregas */}
                    {eq.hitos.length > 0 && eq.projectId && (
                      <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4">
                        <p className="text-sm font-medium text-ink">
                          Hitos y entregas
                        </p>
                        {eq.hitos.map((hito) => (
                          <MilestoneSubmissions
                            key={hito.id}
                            milestone={hito}
                            projectId={eq.projectId!}
                            currentUserId={user.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2 · En revisión: esperando respuesta (se puede retirar). */}
          {enRevision.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-ink">En revisión</h2>
              <p className="mt-0.5 text-sm text-muted">
                Esperando respuesta de la organización.
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {enRevision.map((p) => (
                  <ApplicationRow key={p.id} p={p} />
                ))}
              </ul>
            </section>
          )}

          {/* 3 · Cerradas: rechazadas/retiradas, plegadas (historial). */}
          {cerradas.length > 0 && (
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-ink">
                <svg
                  viewBox="0 0 24 24"
                  className="size-4 transition-transform group-open:rotate-90"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
                Cerradas ({cerradas.length})
              </summary>
              <ul className="mt-4 flex flex-col gap-3">
                {cerradas.map((p) => (
                  <ApplicationRow key={p.id} p={p} />
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

/** Fila de una postulación: proyecto, rol, estado y (si aplica) retirar. */
function ApplicationRow({ p }: { p: MyApplication }) {
  const estado = ESTADO[p.status] ?? {
    label: p.status,
    tone: "neutral" as BadgeTone,
  };
  const proyecto = p.role?.project;
  return (
    <li className="flex items-start justify-between gap-4 rounded-lg border border-border bg-white p-5">
      <div className="flex flex-col gap-1">
        <Link
          href={`/proyectos/${proyecto?.id}`}
          className="font-semibold text-ink hover:text-electric"
        >
          {proyecto?.titulo}
        </Link>
        <span className="text-sm text-muted">
          Rol: {p.role?.nombre}
          {proyecto?.organization?.nombre &&
            ` · ${proyecto.organization.nombre}`}
        </span>
      </div>

      <div className="flex flex-col items-end gap-2">
        <Badge tone={estado.tone}>{estado.label}</Badge>
        {/* Retirar solo tiene sentido mientras está enviada. */}
        {p.status === "enviada" && (
          <form action={withdrawApplication}>
            <input type="hidden" name="applicationId" value={p.id} />
            <SubmitButton variant="ghost" size="sm" pendingText="Retirando…">
              Retirar
            </SubmitButton>
          </form>
        )}
      </div>
    </li>
  );
}
