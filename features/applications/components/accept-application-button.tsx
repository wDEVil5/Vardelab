"use client";

import { useActionState, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  acceptApplication,
  rejectApplication,
  type AcceptApplicationState,
  type RejectApplicationState,
} from "@/features/applications/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const INITIAL: AcceptApplicationState = {};
const REJECT_INITIAL: RejectApplicationState = {};
const EASE = [0.22, 1, 0.36, 1] as const;

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

/**
 * Botón "Rechazar" con confirmación en dos pasos — no se puede deshacer, así
 * que ya no rechaza al primer click.
 */
export function RejectApplicationButton({
  applicationId,
  projectId,
}: {
  applicationId: string;
  projectId: string;
}) {
  const [state, formAction] = useActionState(rejectApplication, REJECT_INITIAL);
  const [confirming, setConfirming] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      {confirming ? (
        <motion.form
          key="confirm"
          action={formAction}
          initial={reduceMotion ? false : { opacity: 0, scaleY: 0.6, y: -6 }}
          animate={{ opacity: 1, scaleY: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, scaleY: 0.6, y: -6 }}
          transition={{ duration: 0.2, ease: EASE }}
          style={{ transformOrigin: "top center" }}
          className="flex flex-col gap-1.5"
        >
          <input type="hidden" name="applicationId" value={applicationId} />
          <input type="hidden" name="projectId" value={projectId} />
          <SubmitButton variant="danger" size="sm" pendingText="Rechazando…" className="w-full">
            Sí, rechazar
          </SubmitButton>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className={cn(buttonClasses({ variant: "ghost", size: "sm" }), "w-full")}
          >
            Cancelar
          </button>
          {state.error && (
            <p role="alert" className="text-xs text-coral">
              {state.error}
            </p>
          )}
        </motion.form>
      ) : (
        <motion.div
          key="trigger"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={cn(buttonClasses({ variant: "ghost", size: "sm" }), "w-full")}
          >
            Rechazar
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
