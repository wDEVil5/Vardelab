"use client";

import { useActionState } from "react";
import {
  approveProject,
  rejectProject,
  type ModerationState,
} from "@/features/projects/actions";
import { Button, buttonClasses } from "@/components/ui/button";

const INITIAL: ModerationState = {};

/**
 * Acciones de moderación sobre un proyecto en revisión: aprobar (lo publica) o
 * rechazar (lo devuelve a borrador para que el gestor lo ajuste). Cada acción
 * tiene su propio estado para poder mostrar su error.
 */
export function ModerationControls({ projectId }: { projectId: string }) {
  const [approveState, approveAction] = useActionState(approveProject, INITIAL);
  const [rejectState, rejectAction] = useActionState(rejectProject, INITIAL);
  const error = approveState.error ?? rejectState.error;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <form action={approveAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <Button type="submit" size="sm">
            Aprobar y publicar
          </Button>
        </form>
        <form action={rejectAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <button
            type="submit"
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            Rechazar (a borrador)
          </button>
        </form>
      </div>
      {error && (
        <p role="alert" className="text-sm text-coral">
          {error}
        </p>
      )}
    </div>
  );
}
