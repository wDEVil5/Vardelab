"use client";

import { useActionState, useState } from "react";
import { confirmTeam, type ConfirmTeamState } from "@/features/applications/actions";
import { Button, buttonClasses } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

const INITIAL: ConfirmTeamState = {};

/**
 * Botón "Confirmar equipo" (S-04): cierra la selección y pasa el proyecto a
 * `activo` (M29). Solo tiene sentido mientras el proyecto está `seleccion` y
 * ya hay al menos un integrante — fuera de eso queda deshabilitado o, si ya
 * se confirmó, se reemplaza por un aviso.
 *
 * Confirmar con algún rol sin cubrir es una trampa silenciosa: una vez
 * `activo`, la RLS de `applications` (M33) ya no deja postular a ese
 * proyecto para ningún rol, y no existe otro camino para sumar un
 * integrante al equipo fuera de aceptar una postulación — ese rol queda
 * huérfano para siempre. Si `rolesSinCubrir` no está vacío, el primer click
 * no envía el form: revela una advertencia con los roles afectados y pide
 * un segundo click para confirmar así a propósito (mismo patrón de
 * confirmación en dos pasos que `DeleteProjectButton`, sin `confirm()` del
 * navegador).
 */
export function ConfirmTeamButton({
  projectId,
  puedeConfirmar,
  yaConfirmado,
  rolesSinCubrir,
}: {
  projectId: string;
  puedeConfirmar: boolean;
  yaConfirmado: boolean;
  rolesSinCubrir: string[];
}) {
  const [state, formAction] = useActionState(confirmTeam, INITIAL);
  const [confirmandoIncompleto, setConfirmandoIncompleto] = useState(false);

  if (yaConfirmado) {
    return (
      <div className="rounded-lg bg-sprout/10 py-2.5 text-center text-sm font-medium text-ink">
        Equipo confirmado
      </div>
    );
  }

  if (!puedeConfirmar) {
    return (
      <div className="flex flex-col items-stretch gap-1.5">
        <Button variant="primary" disabled className="w-full">
          Confirmar equipo
        </Button>
        <span className="text-center text-xs text-muted">
          Selecciona al menos un integrante para confirmar.
        </span>
      </div>
    );
  }

  if (rolesSinCubrir.length > 0 && !confirmandoIncompleto) {
    return (
      <div className="flex flex-col items-stretch gap-1.5">
        <Button
          type="button"
          variant="primary"
          className="w-full"
          onClick={() => setConfirmandoIncompleto(true)}
        >
          Confirmar equipo
        </Button>
        <span className="text-center text-xs text-muted">
          Sin cubrir: {rolesSinCubrir.join(", ")}.
        </span>
      </div>
    );
  }

  if (confirmandoIncompleto) {
    return (
      <div className="flex flex-col items-stretch gap-2 rounded-lg border border-coral/30 bg-coral/5 p-3">
        <p className="text-xs text-ink">
          {rolesSinCubrir.length === 1 ? "El rol" : "Los roles"}{" "}
          <strong>{rolesSinCubrir.join(", ")}</strong> se quedará
          {rolesSinCubrir.length === 1 ? "" : "n"} sin nadie: una vez activo el
          proyecto ya no se puede postular a él, así que no hay forma de
          cubrirlo después.
        </p>
        <form action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="projectId" value={projectId} />
          <SubmitButton
            variant="danger"
            size="sm"
            pendingText="Confirmando…"
          >
            Confirmar así
          </SubmitButton>
          <button
            type="button"
            onClick={() => setConfirmandoIncompleto(false)}
            className={buttonClasses({ variant: "ghost", size: "sm" })}
          >
            Cancelar
          </button>
        </form>
        {state.error && (
          <p role="alert" className="text-center text-xs text-coral">
            {state.error}
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-stretch gap-1.5">
      <input type="hidden" name="projectId" value={projectId} />
      <SubmitButton variant="primary" pendingText="Confirmando…" className="w-full">
        Confirmar equipo
      </SubmitButton>
      {state.error && (
        <p role="alert" className="text-center text-xs text-coral">
          {state.error}
        </p>
      )}
    </form>
  );
}
