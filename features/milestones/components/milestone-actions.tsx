"use client";

import { useActionState, useState, type ReactNode } from "react";
import {
  approveMilestone,
  returnMilestone,
  deleteMilestone,
  type MilestoneActionState,
} from "@/features/milestones/actions";
import { Button, buttonClasses, type ButtonVariant, type ButtonSize } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
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
/**
 * Aprobar un hito no se puede deshacer (`approveMilestone` solo transiciona
 * desde `entregado`, no hay acción para reabrirlo) — confirmación en modal,
 * no inline. No hace falta cerrarlo manualmente: el bloque que lo contiene
 * solo se muestra mientras el hito está "en revisión", así que al aprobar
 * deja de renderizarse.
 */
export function ApproveMilestoneButton({ milestoneId, projectId, children, variant = "primary", size = "sm", className }: ButtonProps) {
  const [state, formAction] = useActionState(approveMilestone, INITIAL);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(buttonClasses({ variant, size }), className)}
      >
        {children}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="¿Aprobar este hito?">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink">No se puede reabrir después de aprobarlo.</p>

          {state.error && (
            <p role="alert" className="text-sm text-coral">
              {state.error}
            </p>
          )}

          <form action={formAction} className="flex justify-end gap-2">
            <input type="hidden" name="milestoneId" value={milestoneId} />
            <input type="hidden" name="projectId" value={projectId} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              Cancelar
            </button>
            <Button type="submit" variant="primary" size="sm">
              Sí, aprobar
            </Button>
          </form>
        </div>
      </Modal>
    </>
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
 * Eliminar un hito no se puede deshacer, así que pide confirmación en modal
 * en vez de borrar al primer click. No hace falta cerrarlo manualmente: el
 * hito desaparece de la lista al eliminarlo, así que el componente entero se
 * desmonta.
 */
export function DeleteMilestoneButton({ milestoneId, projectId, children, variant = "ghost", size = "sm", className }: ButtonProps) {
  const [state, formAction] = useActionState(deleteMilestone, INITIAL);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(buttonClasses({ variant, size }), className)}
      >
        {children}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="¿Eliminar este hito?">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink">Esta acción no se puede deshacer.</p>

          {state.error && (
            <p role="alert" className="text-sm text-coral">
              {state.error}
            </p>
          )}

          <form action={formAction} className="flex justify-end gap-2">
            <input type="hidden" name="milestoneId" value={milestoneId} />
            <input type="hidden" name="projectId" value={projectId} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              Cancelar
            </button>
            <Button type="submit" variant="danger" size="sm">
              Sí, eliminar
            </Button>
          </form>
        </div>
      </Modal>
    </>
  );
}
