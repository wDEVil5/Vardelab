"use client";

import { useActionState, useEffect, useState } from "react";
import { ActionSuccess } from "@/components/ui/action-success";
import { Button } from "@/components/ui/button";
import {
  addMilestone,
  type AddMilestoneState,
} from "@/features/milestones/actions";
import { Input } from "@/components/ui/input";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";

const INITIAL: AddMilestoneState = {};

/** Conserva la confirmación hasta cerrar o empezar un nuevo hito. */
export function AddMilestoneForm({ projectId, onDone, onPendingChange }: { projectId: string; onDone?: () => void; onPendingChange?: (pending: boolean) => void }) {
  const [entry, setEntry] = useState(0);
  return <MilestoneEntry key={entry} projectId={projectId} onDone={onDone} onPendingChange={onPendingChange} onAgain={() => setEntry(entry + 1)} />;
}

function MilestoneEntry({ projectId, onDone, onAgain, onPendingChange }: { projectId: string; onDone?: () => void; onAgain: () => void; onPendingChange?: (pending: boolean) => void }) {
  const [state, formAction, pending] = useActionState(addMilestone, INITIAL);
  useEffect(() => { onPendingChange?.(pending); }, [pending, onPendingChange]);

  if (state.created) return (
    <div className="space-y-6">
      <ActionSuccess title="Hito agregado" description={`«${state.created}» ya forma parte del plan de trabajo.`} />
      <div className="flex flex-wrap justify-end gap-3">
        <Button autoFocus variant="outline" className="min-h-11" onClick={onAgain}>Agregar otro hito</Button>
        {onDone && <Button className="min-h-11" onClick={onDone}>Listo</Button>}
      </div>
    </div>
  );

  return (
    <form action={formAction} aria-busy={pending}>
      <fieldset disabled={pending} className="flex min-w-0 flex-col gap-4">
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
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <SubmitButton className="min-h-11 w-full" pendingText="Agregando…">Agregar hito</SubmitButton>
      </div>
      </fieldset>
    </form>
  );
}
