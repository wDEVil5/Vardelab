"use client";

import { useActionState } from "react";
import {
  acceptApplication,
  rejectApplication,
  type AcceptApplicationState,
  type RejectApplicationState,
} from "@/features/applications/actions";
import { SubmitButton } from "@/components/ui/submit-button";

const INITIAL: AcceptApplicationState = {};
const REJECT_INITIAL: RejectApplicationState = {};

/**
 * Botón "Seleccionar". La UI ya oculta este botón si `cuposLlenos` (calculado
 * en el server al cargar la página), pero eso es solo la primera capa — dos
 * gestores aceptando casi al mismo tiempo, o una pestaña vieja sin recargar,
 * pueden llegar a este submit igual. La guarda real vive en `accept_application`
 * (M84, atómica en Postgres); acá solo se muestra el resultado si el cupo se
 * llenó justo antes de que esta aceptación llegara a la base.
 */
export function AcceptApplicationButton({
  applicationId,
  projectId,
}: {
  applicationId: string;
  projectId: string;
}) {
  const [state, formAction] = useActionState(acceptApplication, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="projectId" value={projectId} />
      <SubmitButton variant="primary" size="sm" pendingText="Seleccionando…" className="w-full">
        Seleccionar
      </SubmitButton>
      {state.error && (
        <p role="alert" className="text-xs text-coral">
          {state.error}
        </p>
      )}
    </form>
  );
}

/** Botón "Rechazar", mismo motivo que `AcceptApplicationButton`: antes fallaba en silencio. */
export function RejectApplicationButton({
  applicationId,
  projectId,
}: {
  applicationId: string;
  projectId: string;
}) {
  const [state, formAction] = useActionState(rejectApplication, REJECT_INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="projectId" value={projectId} />
      <SubmitButton variant="ghost" size="sm" pendingText="Rechazando…" className="w-full">
        Rechazar
      </SubmitButton>
      {state.error && (
        <p role="alert" className="text-xs text-coral">
          {state.error}
        </p>
      )}
    </form>
  );
}
