"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { addSubmission, type SubmissionState } from "@/features/submissions/actions";

const INITIAL: SubmissionState = {};

/**
 * E-06 · Formulario de entrega de evidencia de un hito. El modelo guarda "enlace
 * + nota" (no aloja el trabajo): la descripción va como nota y el archivo/enlace
 * como URL. Al guardar sin error, la Server Action redirige al espacio del
 * proyecto (campo oculto `redirectTo`), sin depender de efectos en el cliente.
 */
export function SubmitEvidenceForm({
  milestoneId,
  projectId,
  redirectTo,
}: {
  milestoneId: string;
  projectId: string;
  redirectTo: string;
}) {
  const [state, formAction] = useActionState(addSubmission, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="milestoneId" value={milestoneId} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Descripción</span>
        <Textarea
          name="nota"
          placeholder="Qué hiciste, qué demuestra."
          className="min-h-32"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Archivo o enlace</span>
        <Input type="url" name="url" placeholder="github.com/tu-proyecto" />
        <span className="text-xs text-muted">
          Enlace a donde vive el trabajo: repo, deploy, Figma, video…
        </span>
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <SubmitButton className="w-full" pendingText="Enviando…">
        Enviar evidencia
      </SubmitButton>
    </form>
  );
}
