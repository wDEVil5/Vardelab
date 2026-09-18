"use client";

import { useActionState, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { removeOrganizationMember, type RemoveMemberState } from "@/features/organizations/actions";
import { buttonClasses } from "@/components/ui/button";

const INITIAL: RemoveMemberState = {};
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Botón "Quitar" con confirmación en dos pasos (mismo patrón que
 * `RemoveTeamMemberButton`) — deja de gestionar la organización, no es algo
 * para borrar sin querer.
 */
export function RemoveMemberButton({ memberId, orgId }: { memberId: string; orgId: string }) {
  const [state, formAction] = useActionState(removeOrganizationMember, INITIAL);
  const [confirming, setConfirming] = useState(false);
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
          <input type="hidden" name="memberId" value={memberId} />
          <input type="hidden" name="orgId" value={orgId} />
          <div className="flex items-center gap-1.5">
            <button type="submit" className={buttonClasses({ variant: "danger", size: "sm" })}>
              Sí, quitar
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
          className={buttonClasses({ variant: "ghost", size: "sm" })}
        >
          Quitar
        </motion.button>
      )}
    </AnimatePresence>
  );
}
