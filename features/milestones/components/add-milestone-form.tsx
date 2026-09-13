"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  addMilestone,
  type AddMilestoneState,
} from "@/features/milestones/actions";
import { Input } from "@/components/ui/input";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/features/auth/components/submit-button";

const INITIAL: AddMilestoneState = {};

/** Formulario para agregar un hito. Limpia los campos tras un alta exitosa. */
export function AddMilestoneForm({ projectId }: { projectId: string }) {
  const [state, formAction] = useActionState(addMilestone, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const enviado = useRef(false);

  useEffect(() => {
    if (enviado.current && !state.error) formRef.current?.reset();
    enviado.current = true;
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="projectId" value={projectId} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-xs text-muted">Título</span>
          <Input name="titulo" required placeholder="Título del hito" />
        </label>
        <label className="flex flex-col gap-1.5 sm:max-w-24">
          <span className="flex items-center gap-1 text-xs text-muted">
            Orden
            <InfoTooltip text="Define en qué posición aparece este hito dentro del plan. El de menor número va primero." />
          </span>
          <Input type="number" name="orden" min={0} defaultValue={0} />
        </label>
      </div>

      <Textarea
        name="descripcion"
        placeholder="Qué se espera en este hito (opcional)"
        className="min-h-16"
      />

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted">Fecha límite (opcional)</span>
        <Input type="date" name="fecha_limite" className="max-w-44" />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <div>
        <SubmitButton pendingText="Agregando…">Agregar hito</SubmitButton>
      </div>
    </form>
  );
}
