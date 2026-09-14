"use client";

import { useActionState, useState } from "react";
import {
  cancelProject,
  type CancelProjectState,
} from "@/features/projects/actions";
import { Button, buttonClasses } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

const INITIAL: CancelProjectState = {};

/**
 * Botón para cancelar un proyecto (M60). Antes era un confirmar en dos pasos
 * inline (mismo patrón que `DeleteProjectButton`) — se cambió a un modal
 * porque cancelar tiene consecuencias que no son obvias de un vistazo (avisa
 * al equipo si ya lo tiene, no se puede deshacer) y un botón que se
 * transforma en su lugar es fácil de confirmar sin leerlo. El modal fuerza a
 * pasar por el texto de advertencia antes de que el botón de confirmar
 * siquiera exista en pantalla.
 */
export function CancelProjectButton({ projectId }: { projectId: string }) {
  const [state, formAction] = useActionState(cancelProject, INITIAL);
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-coral/30 bg-coral/5 p-5">
      <p className="text-sm font-medium text-ink">Cancelar proyecto</p>
      <p className="text-xs text-muted">
        El proyecto queda marcado como cancelado y deja de aceptar
        postulaciones.
      </p>

      <div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={buttonClasses({ variant: "secondary", size: "sm" })}
        >
          Cancelar proyecto
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="¿Cancelar este proyecto?">
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2.5 text-sm text-ink">
            <li className="flex gap-2.5">
              <IconAdvertencia className="mt-0.5 size-4 shrink-0 text-coral" />
              <span>Deja de aceptar postulaciones de inmediato.</span>
            </li>
            <li className="flex gap-2.5">
              <IconAdvertencia className="mt-0.5 size-4 shrink-0 text-coral" />
              <span>
                Si ya tiene equipo formado, cada integrante recibe una
                notificación avisando que el proyecto se canceló.
              </span>
            </li>
            <li className="flex gap-2.5">
              <IconAdvertencia className="mt-0.5 size-4 shrink-0 text-coral" />
              <span className="font-medium">
                No se puede deshacer desde acá.
              </span>
            </li>
          </ul>

          {state.error && (
            <p role="alert" className="text-sm text-coral">
              {state.error}
            </p>
          )}

          <form action={formAction} className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              Volver
            </button>
            <input type="hidden" name="projectId" value={projectId} />
            <Button type="submit" variant="danger" size="sm">
              Sí, cancelar proyecto
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
}

function IconAdvertencia({ className }: { className?: string }) {
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
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    </svg>
  );
}
