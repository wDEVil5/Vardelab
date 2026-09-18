"use client";

import { useActionState, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  approveMilestone,
  returnMilestone,
  deleteMilestone,
  type MilestoneActionState,
} from "@/features/milestones/actions";
import { buttonClasses, type ButtonVariant, type ButtonSize } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const INITIAL: MilestoneActionState = {};
const EASE = [0.22, 1, 0.36, 1] as const;

type ButtonProps = {
  milestoneId: string;
  projectId: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

/**
 * Los tres botones de acción sobre un hito (aprobar, pedir cambios, eliminar)
 * comparten la misma forma: cada uno con su propio `useActionState` para
 * mostrar el error inline si falla — antes las tres acciones fallaban en
 * silencio (solo `console.error`), sin que quien gestiona el proyecto se
 * enterara.
 */
export function ApproveMilestoneButton({ milestoneId, projectId, children, variant = "primary", size = "sm", className }: ButtonProps) {
  const [state, formAction] = useActionState(approveMilestone, INITIAL);
  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="milestoneId" value={milestoneId} />
      <input type="hidden" name="projectId" value={projectId} />
      <button type="submit" className={cn(buttonClasses({ variant, size }), className)}>
        {children}
      </button>
      {state.error && (
        <p role="alert" className="text-xs text-coral">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function ReturnMilestoneButton({ milestoneId, projectId, children, variant = "secondary", size = "sm", className }: ButtonProps) {
  const [state, formAction] = useActionState(returnMilestone, INITIAL);
  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="milestoneId" value={milestoneId} />
      <input type="hidden" name="projectId" value={projectId} />
      <button type="submit" className={cn(buttonClasses({ variant, size }), className)}>
        {children}
      </button>
      {state.error && (
        <p role="alert" className="text-xs text-coral">
          {state.error}
        </p>
      )}
    </form>
  );
}

/**
 * Eliminar un hito no se puede deshacer, así que pide confirmación en dos
 * pasos (mismo patrón que `DeleteOrgButton`/`RemoveTeamMemberButton`) en vez
 * de borrar al primer click.
 */
export function DeleteMilestoneButton({ milestoneId, projectId, children, variant = "ghost", size = "sm", className }: ButtonProps) {
  const [state, formAction] = useActionState(deleteMilestone, INITIAL);
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
          <input type="hidden" name="milestoneId" value={milestoneId} />
          <input type="hidden" name="projectId" value={projectId} />
          <div className="flex items-center gap-1.5">
            <button type="submit" className={cn(buttonClasses({ variant: "danger", size }), className)}>
              Sí, eliminar
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className={cn(buttonClasses({ variant: "ghost", size }), className)}
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
          className={cn(buttonClasses({ variant, size }), className)}
        >
          {children}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
