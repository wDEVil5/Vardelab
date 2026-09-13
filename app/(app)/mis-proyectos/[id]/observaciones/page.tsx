import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/features/auth/queries";
import { getProjectObservations } from "@/features/projects/queries";
import { ObservationsChecklist } from "@/features/projects/components/observations-checklist";
import { ResendToReviewForm } from "@/features/projects/components/resend-to-review-form";

export const metadata: Metadata = {
  title: "Observaciones del moderador · CampusLab",
};

type PageProps = { params: Promise<{ id: string }> };

/**
 * Observaciones del moderador (S-07): el patrocinador ve por qué se rechazó
 * su proyecto, marca qué observaciones ya resolvió, responde y reenvía a
 * revisión. Solo tiene sentido si hubo al menos un comentario de moderación
 * alguna vez — si no, 404 (no hay nada que mostrar acá).
 */
export default async function ObservacionesProyectoPage({ params }: PageProps) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/ingresar?next=/mis-proyectos/${id}/observaciones`);

  const project = await getProjectObservations(id);
  if (!project || !project.comentario_moderacion) notFound();

  const observaciones = project.observaciones ?? [];
  const enRevision = project.status === "en_revision";

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:py-10">
      <Link
        href={`/mis-proyectos/${id}`}
        className="text-sm text-muted transition-colors hover:text-electric"
      >
        ← Volver al proyecto
      </Link>

      <header className="mt-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink">
          Observaciones del moderador
        </h1>
        <p className="text-sm text-muted">
          {enRevision
            ? "Ya reenviaste el proyecto: esto es lo que se pidió la vez pasada."
            : "Responde las correcciones antes de reenviar a revisión."}
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-border bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <span className="font-semibold text-ink">{project.titulo}</span>
          <Badge tone={enRevision ? "brand" : "outline"} className="shrink-0">
            {enRevision ? "En revisión" : "Requiere cambios"}
          </Badge>
        </div>
        <p className="text-sm text-muted">{project.comentario_moderacion}</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="rounded-2xl border border-border bg-white p-8">
          {observaciones.length > 0 ? (
            <ObservationsChecklist projectId={id} observaciones={observaciones} />
          ) : (
            <p className="text-sm text-muted">
              El moderador no dejó observaciones puntuales, solo el comentario
              de arriba.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-white p-6">
          {enRevision ? (
            <>
              <h2 className="text-lg font-semibold text-ink">Tu respuesta</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-muted">
                {project.respuesta_patrocinador ||
                  "No dejaste ningún comentario al reenviar."}
              </p>
              <p className="mt-4 text-xs text-muted">
                El moderador lo verá al revisar de nuevo.
              </p>
            </>
          ) : (
            <ResendToReviewForm
              projectId={id}
              defaultRespuesta={project.respuesta_patrocinador}
            />
          )}
        </div>
      </div>
    </div>
  );
}
