"use client";

import { useActionState } from "react";
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
}: {
  projectId: string;
  milestoneId: string | null;
  puedeCerrar: boolean;
}) {
  const [state, formAction] = useActionState(closeProject, INITIAL);

  if (!puedeCerrar || !milestoneId) {
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
    <form action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="milestoneId" value={milestoneId} />
      <SubmitButton variant="primary" pendingText="Cerrando…">
        Validar y cerrar
      </SubmitButton>
      {state.error && (
        <p role="alert" className="text-xs text-coral">
          {state.error}
        </p>
      )}
    </form>
  );
}
