"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  addMilestone,
  type AddMilestoneState,
} from "@/features/milestones/actions";
import { Input } from "@/components/ui/input";
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
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-border bg-white p-5"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <p className="text-sm font-medium text-ink">Agregar un hito</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input name="titulo" required placeholder="Título del hito" />
        <Input
          type="number"
          name="orden"
          min={0}
          defaultValue={0}
          className="sm:max-w-24"
          aria-label="Orden"
          placeholder="Orden"
        />
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
