"use client";

import { useActionState, useState } from "react";
import {
  deleteProject,
  type DeleteProjectState,
} from "@/features/projects/actions";
import { Button, buttonClasses } from "@/components/ui/button";

const INITIAL: DeleteProjectState = {};

/**
 * Botón de eliminación con confirmación en dos pasos (sin `confirm()` del
 * navegador): el primer click revela "¿Seguro?" con confirmar/cancelar. Muestra
 * el error de las guardas del servidor (borrador / sin postulaciones) si aplica.
 */
export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [state, formAction] = useActionState(deleteProject, INITIAL);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-coral/30 bg-coral/5 p-5">
      <p className="text-sm font-medium text-ink">Eliminar proyecto</p>
      <p className="text-xs text-muted">
        Solo si está en borrador y sin postulaciones. Esta acción no se puede
        deshacer.
      </p>

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      {confirming ? (
        <form action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="projectId" value={projectId} />
          <Button type="submit" variant="danger" size="sm">
            Sí, eliminar
          </Button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className={buttonClasses({ variant: "ghost", size: "sm" })}
          >
            Cancelar
          </button>
        </form>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            Eliminar proyecto
          </button>
        </div>
      )}
    </div>
  );
}
