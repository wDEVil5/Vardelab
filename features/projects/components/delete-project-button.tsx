"use client";

import { useActionState, useState } from "react";
import {
  deleteProject,
  type DeleteProjectState,
} from "@/features/projects/actions";
import { Button, buttonClasses } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

const INITIAL: DeleteProjectState = {};

/**
 * Botón de eliminación con confirmación en modal (sin `confirm()` del
 * navegador). Muestra el error de las guardas del servidor (borrador / sin
 * postulaciones) si aplica.
 */
export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [state, formAction] = useActionState(deleteProject, INITIAL);
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-coral/30 bg-coral/5 p-5">
      <p className="text-sm font-medium text-ink">Eliminar proyecto</p>
      <p className="text-xs text-muted">
        Solo si está en borrador y sin postulaciones. Esta acción no se puede
        deshacer.
      </p>

      <div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={buttonClasses({ variant: "secondary", size: "sm" })}
        >
          Eliminar proyecto
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="¿Eliminar este proyecto?">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink">
            Solo se puede si está en borrador y sin postulaciones. Esta acción
            no se puede deshacer.
          </p>

          {state.error && (
            <p role="alert" className="text-sm text-coral">
              {state.error}
            </p>
          )}

          <form action={formAction} className="flex justify-end gap-2">
            <input type="hidden" name="projectId" value={projectId} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              Cancelar
            </button>
            <Button type="submit" variant="danger" size="sm">
              Sí, eliminar
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
}
