"use client";

import { useActionState } from "react";
import {
  submitProjectForReview,
  withdrawFromReview,
  unpublishProject,
  type PublishState,
} from "@/features/projects/actions";
import { Button, buttonClasses } from "@/components/ui/button";

const INITIAL: PublishState = {};

/**
 * Controles de publicación de un proyecto, según su estado:
 *   · borrador     → "Enviar a revisión" (un moderador debe aprobarlo).
 *   · en_revision  → aviso de espera + opción de retirarlo de la cola.
 *   · publicado    → aviso de visible + opción de volver a borrador.
 */
export function PublishControls({
  projectId,
  status,
}: {
  projectId: string;
  status: string;
}) {
  const [state, formAction] = useActionState(submitProjectForReview, INITIAL);

  if (status === "publicado") {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface/50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink">
          Este proyecto está <span className="font-medium">publicado</span> y
          visible en el catálogo.
        </p>
        <form action={unpublishProject}>
          <input type="hidden" name="projectId" value={projectId} />
          <button
            type="submit"
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            Volver a borrador
          </button>
        </form>
      </div>
    );
  }

  if (status === "en_revision") {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-electric/20 bg-electric/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink">
          En <span className="font-medium">revisión</span>. Un moderador la
          revisará antes de publicarla en el catálogo.
        </p>
        <form action={withdrawFromReview}>
          <input type="hidden" name="projectId" value={projectId} />
          <button
            type="submit"
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            Retirar de revisión
          </button>
        </form>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 rounded-lg border border-border bg-white p-5"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <p className="text-sm text-ink">
        Cuando el proyecto esté listo, envíalo a revisión. Un moderador lo
        aprobará para que aparezca en el catálogo y reciba postulaciones.
      </p>
      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}
      <div>
        <Button type="submit" size="sm">
          Enviar a revisión
        </Button>
      </div>
    </form>
  );
}
