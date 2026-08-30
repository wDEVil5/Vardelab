import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/features/auth/queries";
import { getMyApplications } from "@/features/applications/queries";
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

/** S-04 · Panel del estudiante: sus postulaciones. Requiere sesión. */
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

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Mis postulaciones</h1>
        <p className="text-sm text-muted">
          El estado de los roles a los que postulaste.
        </p>
      </header>

      {/* Equipos a los que fui aceptado */}
      {equiposConHitos.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-ink">Mis equipos</h2>
          <div className="mt-3 flex flex-col gap-3">
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

      {postulaciones.length === 0 ? (
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
        <ul className="mt-8 flex flex-col gap-3">
          {postulaciones.map((p) => {
            const estado = ESTADO[p.status] ?? {
              label: p.status,
              tone: "neutral" as BadgeTone,
            };
            const proyecto = p.role?.project;
            return (
              <li
                key={p.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-border bg-white p-5"
              >
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
                      <button
                        type="submit"
                        className={buttonClasses({
                          variant: "ghost",
                          size: "sm",
                        })}
                      >
                        Retirar
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
