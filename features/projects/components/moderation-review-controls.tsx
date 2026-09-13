"use client";

import { useActionState } from "react";
import {
  approveProject,
  rejectProject,
  type ModerationState,
} from "@/features/projects/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ObservationsEditor } from "@/features/projects/components/observations-editor";

const INITIAL: ModerationState = {};

/**
 * Decisión sobre un proyecto en revisión (M-02): aprobar lo publica de
 * inmediato. "Solicitar correcciones" y "Rechazar" hacen exactamente la misma
 * transición de estado (`en_revision → borrador`, M18) — no hay un tercer
 * estado en el modelo — pero comparten el mismo comentario obligatorio (M21),
 * así el moderador elige el tono que mejor describe el caso. Las observaciones
 * puntuales (M36, opcionales) son el detalle por ítem que el gestor ve y va
 * marcando en su propia pantalla (S-07); el comentario sigue siendo el resumen
 * general obligatorio.
 */
export function ModerationReviewControls({
  projectId,
}: {
  projectId: string;
}) {
  const [approveState, approveAction] = useActionState(approveProject, INITIAL);
  const [rejectState, rejectAction] = useActionState(rejectProject, INITIAL);

  return (
    <div className="flex flex-col gap-3">
      <form action={approveAction}>
        <input type="hidden" name="projectId" value={projectId} />
        <Button type="submit" className="w-full">
          Aprobar
        </Button>
        {approveState.error && (
          <p role="alert" className="mt-2 text-sm text-coral">
            {approveState.error}
          </p>
        )}
      </form>

      <form action={rejectAction} className="flex flex-col gap-3">
        <input type="hidden" name="projectId" value={projectId} />

        <Button type="submit" variant="outline-primary" className="w-full">
          Solicitar correcciones
        </Button>
        <Button type="submit" variant="outline-danger" className="w-full">
          Rechazar
        </Button>

        <label className="mt-2 flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Comentario</span>
          <Textarea
            name="comentario"
            required
            placeholder="Escribe qué debe cambiar…"
            className="min-h-28"
          />
        </label>

        <div className="flex flex-col gap-1.5 border-t border-border pt-3">
          <span className="text-sm font-medium text-ink">
            Observaciones puntuales <span className="text-muted">(opcional)</span>
          </span>
          <ObservationsEditor />
        </div>

        {rejectState.error && (
          <p role="alert" className="text-sm text-coral">
            {rejectState.error}
          </p>
        )}
      </form>
    </div>
  );
}
