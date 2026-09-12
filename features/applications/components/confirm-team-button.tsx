"use client";

import { useActionState } from "react";
import { confirmTeam, type ConfirmTeamState } from "@/features/applications/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

const INITIAL: ConfirmTeamState = {};

/**
 * Botón "Confirmar equipo" (S-04): cierra la selección y pasa el proyecto a
 * `activo` (M29). Solo tiene sentido mientras el proyecto está `seleccion` y
 * ya hay al menos un integrante — fuera de eso queda deshabilitado o, si ya
 * se confirmó, se reemplaza por un aviso.
 */
export function ConfirmTeamButton({
  projectId,
  puedeConfirmar,
  yaConfirmado,
}: {
  projectId: string;
  puedeConfirmar: boolean;
  yaConfirmado: boolean;
}) {
  const [state, formAction] = useActionState(confirmTeam, INITIAL);

  if (yaConfirmado) {
    return <Badge tone="success">Equipo confirmado</Badge>;
  }

  if (!puedeConfirmar) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <Button variant="primary" disabled>
          Confirmar equipo
        </Button>
        <span className="text-xs text-muted">
          Selecciona al menos un integrante para confirmar.
        </span>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="projectId" value={projectId} />
      <SubmitButton variant="primary" pendingText="Confirmando…">
        Confirmar equipo
      </SubmitButton>
      {state.error && (
        <p role="alert" className="text-xs text-coral">
          {state.error}
        </p>
      )}
    </form>
  );
}
