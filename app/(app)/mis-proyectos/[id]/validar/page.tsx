import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/features/auth/queries";
import { getManagedProject } from "@/features/projects/queries";
import { getTeamForEvaluation } from "@/features/evaluations/queries";
import { getMilestonesWithSubmissions } from "@/features/milestones/queries";
import { returnMilestone } from "@/features/milestones/actions";
import { MemberEvaluationForm } from "@/features/evaluations/components/member-evaluation-form";
import { CloseProjectButton } from "@/features/projects/components/close-project-button";

export const metadata: Metadata = {
  title: "Validar entrega y evaluar · CampusLab",
};

// Fecha de la entrega en términos relativos.
function haceCuanto(iso: string): string {
  const horas = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (horas < 1) return "recién";
  if (horas < 24) return `hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? "hace 1 día" : `hace ${dias} días`;
}

type PageProps = { params: Promise<{ id: string }> };

/** Validar entrega y evaluar (S-06): revisar la entrega final y cerrar el proyecto. */
export default async function ValidarProyectoPage({ params }: PageProps) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/ingresar?next=/mis-proyectos/${id}/validar`);

  const project = await getManagedProject(id);
  if (!project) notFound();

  const [equipo, hitos] = await Promise.all([
    getTeamForEvaluation(project.id),
    getMilestonesWithSubmissions(project.id),
  ]);

  // El hito final es el último del plan (mayor `orden`); ya vienen ordenados.
  const hitoFinal = hitos.length > 0 ? hitos[hitos.length - 1] : null;
  const entregas = hitoFinal?.submissions ?? [];
  const ultimaEntrega = entregas.length > 0 ? entregas[entregas.length - 1] : null;
  const listoParaValidar =
    project.status === "activo" &&
    hitoFinal != null &&
    (hitoFinal.estado === "entregado" || hitoFinal.estado === "aprobado");

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:py-10">
      <Link
        href={`/mis-proyectos/${project.id}`}
        className="text-sm text-muted transition-colors hover:text-electric"
      >
        ← Volver al proyecto
      </Link>

      <header className="mt-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink">Validar entrega y evaluar</h1>
        <p className="text-sm text-muted">Revisa evidencia antes de cerrar el proyecto.</p>
      </header>

      {project.status !== "activo" && (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface/50 p-5 text-sm text-muted">
          {project.status === "completado"
            ? "Este proyecto ya está cerrado."
            : "Este proyecto todavía no está activo: primero hay que confirmar el equipo."}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="rounded-2xl border border-border bg-white p-8">
          {!hitoFinal ? (
            <p className="text-sm text-muted">
              Este proyecto todavía no tiene hitos definidos.
            </p>
          ) : (
            <>
              <Badge tone="success" className="w-fit">
                Entrega final
              </Badge>
              <h2 className="mt-4 text-xl font-bold text-ink">{project.titulo}</h2>
              <p className="mt-1.5 text-sm text-muted">
                {hitoFinal.estado === "pendiente" || hitoFinal.estado === "en_progreso"
                  ? "El equipo todavía no entregó este hito."
                  : ultimaEntrega
                    ? `Entregado por el equipo · ${haceCuanto(ultimaEntrega.created_at)}`
                    : "Entregado por el equipo"}
              </p>

              <h3 className="mt-8 text-sm font-semibold text-ink">Evidencias</h3>
              {entregas.length === 0 ? (
                <p className="mt-2 text-sm text-muted">Sin evidencias todavía.</p>
              ) : (
                <ul className="mt-4 flex flex-col gap-3">
                  {entregas.map((s) => (
                    <li key={s.id}>
                      <a
                        href={s.url ?? undefined}
                        target={s.url ? "_blank" : undefined}
                        rel={s.url ? "noopener noreferrer" : undefined}
                        className="flex items-center justify-between gap-4 rounded-xl bg-surface/60 p-5 transition-colors hover:bg-surface"
                      >
                        <div className="min-w-0">
                          {s.url && (
                            <p className="truncate text-sm font-medium text-ink">{s.url}</p>
                          )}
                          {s.nota && <p className="mt-1 text-xs text-muted">{s.nota}</p>}
                        </div>
                        {s.url && (
                          <svg
                            viewBox="0 0 24 24"
                            className="size-4 shrink-0 text-muted"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <path d="M7 17L17 7M9 7h8v8" />
                          </svg>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-5 rounded-2xl border border-border bg-white p-6">
          <h2 className="text-sm font-semibold text-ink">Evaluación</h2>

          {!equipo || equipo.length === 0 ? (
            <p className="text-sm text-muted">Este proyecto todavía no tiene equipo.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {equipo.map((m) => (
                <MemberEvaluationForm key={m.userId} member={m} projectId={project.id} />
              ))}
            </ul>
          )}

          <div className="mt-2 flex flex-col gap-3 border-t border-border pt-5">
            <CloseProjectButton
              projectId={project.id}
              milestoneId={hitoFinal?.id ?? null}
              puedeCerrar={listoParaValidar}
            />
            {hitoFinal && hitoFinal.estado === "entregado" && (
              <form action={returnMilestone}>
                <input type="hidden" name="milestoneId" value={hitoFinal.id} />
                <input type="hidden" name="projectId" value={project.id} />
                <button
                  type="submit"
                  className={cn(buttonClasses({ variant: "outline-primary", size: "md" }), "w-full")}
                >
                  Solicitar ajustes
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
