"use client";

import { useActionState } from "react";
import { submitProjectForReview, type PublishState } from "@/features/projects/actions";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";

const INITIAL: PublishState = {};

/**
 * Respuesta al moderador + reenvío a revisión (S-07). Reutiliza
 * `submitProjectForReview` (mismo `borrador → en_revision` que "Enviar a
 * revisión" en `PublishControls`) — la única diferencia es que acá además se
 * manda el campo `respuesta`, que la acción guarda en
 * `projects.respuesta_patrocinador` para que el moderador la vea al revisar de
 * nuevo. Responder es obligatorio: sin eso, el moderador tendría que adivinar
 * qué cambió.
 */
export function ResendToReviewForm({
  projectId,
  defaultRespuesta,
}: {
  projectId: string;
  defaultRespuesta: string | null;
}) {
  const [state, formAction] = useActionState(submitProjectForReview, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="projectId" value={projectId} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Responder al moderador</span>
        <Textarea
          name="respuesta"
          required
          defaultValue={defaultRespuesta ?? ""}
          placeholder="Describe los cambios aplicados…"
          className="min-h-32"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Reenviando…" className="w-full">
        Reenviar a revisión
      </SubmitButton>
    </form>
  );
}
