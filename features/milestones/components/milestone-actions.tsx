"use client";

import { useActionState, type ReactNode } from "react";
import {
  approveMilestone,
  returnMilestone,
  deleteMilestone,
  type MilestoneActionState,
} from "@/features/milestones/actions";
import { buttonClasses, type ButtonVariant, type ButtonSize } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const INITIAL: MilestoneActionState = {};

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

export function DeleteMilestoneButton({ milestoneId, projectId, children, variant = "ghost", size = "sm", className }: ButtonProps) {
  const [state, formAction] = useActionState(deleteMilestone, INITIAL);
  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
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
