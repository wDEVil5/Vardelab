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
 *   · seleccion/activo/completado → solo informativo: ya pasó la etapa de
 *     publicación, así que no hay ninguna acción que ofrecer acá (el enviar a
 *     revisión de vuelta no es una transición válida desde estos estados).
 */
export function PublishControls({
  projectId,
  status,
}: {
  projectId: string;
  status: string;
}) {
  const [state, formAction] = useActionState(submitProjectForReview, INITIAL);

  if (status === "seleccion" || status === "activo" || status === "completado") {
    const texto =
      status === "seleccion"
        ? "El proyecto ya no se publica ni se retira: está en selección de equipo."
        : status === "activo"
          ? "El proyecto ya no se publica ni se retira: está activo, con el equipo trabajando."
          : "El proyecto ya no se publica ni se retira: quedó completado.";
    return <p className="text-sm text-muted">{texto}</p>;
  }

  if (status === "publicado") {
    return (
      <div className="flex flex-col gap-3">
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
      <div className="flex flex-col gap-3">
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
    <form action={formAction} className="flex flex-col gap-3">
      <p className="text-sm text-ink">
        Cuando el proyecto esté listo, envíalo a revisión. Un moderador lo
        aprobará para que aparezca en el catálogo y reciba postulaciones.
      </p>
      <input type="hidden" name="projectId" value={projectId} />
      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full">
        Enviar a revisión
      </Button>
    </form>
  );
}
