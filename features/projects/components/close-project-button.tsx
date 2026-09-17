"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { ActionSuccess } from "@/components/ui/action-success";
import { closeProject, type CloseProjectState } from "@/features/projects/actions";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

const INITIAL: CloseProjectState = {};

/**
 * Botón "Validar y cerrar" (S-06): aprueba el hito final (si hacía falta) y
 * cierra el proyecto (`activo → completado`, M31). Deshabilitado mientras el
 * equipo no entregó el hito final — no tiene sentido cerrar sin nada que
 * validar.
 */
export function CloseProjectButton({
  projectId,
  milestoneId,
  puedeCerrar,
  completado = false,
}: {
  projectId: string;
  milestoneId: string | null;
  puedeCerrar: boolean;
  completado?: boolean;
}) {
  const [state, formAction, pending] = useActionState(closeProject, INITIAL);
  const [open, setOpen] = useState(false);
  const cerrado = completado || state.ok;

  if ((!puedeCerrar || !milestoneId) && !cerrado) {
    return (
      <div className="flex flex-col gap-1.5">
        <Button variant="primary" disabled>
          Validar y cerrar
        </Button>
        <span className="text-xs text-muted">
          El equipo todavía no entregó el hito final.
        </span>
      </div>
    );
  }

  return (
    <>
      {cerrado ? (
        <ActionSuccess title="Proyecto completado" description="La entrega final quedó aprobada y el proyecto está cerrado." />
      ) : (
        <Button className="min-h-11 w-full" onClick={() => setOpen(true)}>Validar y cerrar</Button>
      )}
      <Modal open={open} onClose={() => setOpen(false)} busy={pending} title={cerrado ? "Proyecto completado" : "¿Validar y cerrar el proyecto?"}>
        {cerrado ? (
          <div className="space-y-6">
            <ActionSuccess title="Proyecto cerrado correctamente" description="La entrega final quedó aprobada. El equipo verá el proyecto como completado." />
            <Button autoFocus className="min-h-11 w-full" onClick={() => setOpen(false)}>Listo</Button>
          </div>
        ) : (
          <form action={formAction} className="space-y-6" aria-busy={pending}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="milestoneId" value={milestoneId ?? ""} />
            <p className="text-sm leading-relaxed text-muted">Se aprobará la entrega final y el proyecto pasará a Completado para la organización y el equipo. Revisa las evidencias y evaluaciones antes de continuar.</p>
            {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="min-h-11" disabled={pending} onClick={() => setOpen(false)}>Seguir revisando</Button>
              <SubmitButton className="min-h-11" pendingText="Cerrando proyecto…">Confirmar cierre</SubmitButton>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
