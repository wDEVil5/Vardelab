"use client";

import { useActionState, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  offerOrganizationOwnership,
  type OwnershipState,
} from "@/features/organizations/actions";
import { buttonClasses } from "@/components/ui/button";

const INITIAL: OwnershipState = {};
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Ofrecer la propiedad a un miembro activo. Exige confirmación en dos pasos,
 * igual que quitar a alguien, porque la oferta le llega a la persona y cambia
 * su situación en la organización si la acepta.
 */
export function TransferOwnershipButton({
  orgId,
  newOwnerId,
  nombre,
}: {
  orgId: string;
  newOwnerId: string;
  nombre: string;
}) {
  const [state, formAction] = useActionState(offerOrganizationOwnership, INITIAL);
  const [confirming, setConfirming] = useState(false);
  const [okVisto, setOkVisto] = useState(state.ok);
  if (state.ok !== okVisto) {
    setOkVisto(state.ok);
    if (state.ok) setConfirming(false);
  }
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      {confirming ? (
        <motion.form
          key="confirm"
          action={formAction}
          initial={reduceMotion ? false : { opacity: 0, scaleX: 0.5, x: 12 }}
          animate={{ opacity: 1, scaleX: 1, x: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, scaleX: 0.5, x: 12 }}
          transition={{ duration: 0.2, ease: EASE }}
          style={{ transformOrigin: "right center" }}
          className="flex flex-col items-end gap-1"
        >
          <input type="hidden" name="orgId" value={orgId} />
          <input type="hidden" name="newOwnerId" value={newOwnerId} />
          <p className="text-xs text-muted">
            {nombre} recibirá la oferta. La propiedad cambia solo si la acepta.
          </p>
          <div className="flex items-center gap-1.5">
            <button type="submit" className={buttonClasses({ variant: "primary", size: "sm" })}>
              Sí, ofrecer
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              Cancelar
            </button>
          </div>
          {state.error && (
            <p role="alert" className="text-xs text-coral">
              {state.error}
            </p>
          )}
        </motion.form>
      ) : (
        <motion.button
          key="trigger"
          type="button"
          onClick={() => setConfirming(true)}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.12 }}
          className={buttonClasses({ variant: "outline-primary", size: "sm" })}
        >
          Ofrecer propiedad
        </motion.button>
      )}
    </AnimatePresence>
  );
}
