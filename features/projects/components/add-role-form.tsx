"use client";

import { useActionState, useEffect, useState } from "react";
import { ActionSuccess } from "@/components/ui/action-success";
import { Button } from "@/components/ui/button";
import { addRole, type AddRoleState } from "@/features/projects/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { NewRoleSkillsPicker } from "@/features/projects/components/new-role-skills-picker";
import { cn } from "@/lib/utils";
import type { Skill } from "@/features/skills/queries";

const INITIAL: AddRoleState = {};

// Oculta las flechitas nativas del input numérico (se ven distinto en cada
// navegador y no aportan nada acá): el número se escribe, no se "gira".
const SIN_SPINNERS =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

/**
 * Formulario para agregar un rol a un proyecto, con sus habilidades exigidas
 * de una. Tras guardar muestra una confirmación y permite iniciar otro rol
 * con campos y habilidades vacíos.
 */
export function AddRoleForm({
  projectId,
  catalog,
  onDone,
  onPendingChange,
}: {
  projectId: string;
  catalog: Skill[];
  onDone?: () => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [entry, setEntry] = useState(0);
  return <RoleEntry key={entry} projectId={projectId} catalog={catalog} onDone={onDone} onPendingChange={onPendingChange} onAgain={() => setEntry(entry + 1)} />;
}

function RoleEntry({ projectId, catalog, onDone, onAgain, onPendingChange }: { projectId: string; catalog: Skill[]; onDone?: () => void; onAgain: () => void; onPendingChange?: (pending: boolean) => void }) {
  const [state, formAction, pending] = useActionState(addRole, INITIAL);
  useEffect(() => { onPendingChange?.(pending); }, [pending, onPendingChange]);

  if (state.created) return (
    <div className="space-y-6">
      <ActionSuccess title="Rol agregado" description={`«${state.created}» ya forma parte del proyecto.`} />
      {state.warning && <p role="alert" className="text-sm text-ink">{state.warning}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <Button autoFocus variant="outline" className="min-h-11" onClick={onAgain}>Agregar otro rol</Button>
        {onDone && <Button className="min-h-11" onClick={onDone}>Listo</Button>}
      </div>
    </div>
  );

  return (
    <form action={formAction} aria-busy={pending}>
      <fieldset disabled={pending} className="flex min-w-0 flex-col gap-4">
      <input type="hidden" name="projectId" value={projectId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-muted">Nombre del rol</span>
          <Input name="nombre" required placeholder="Ej: Frontend" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Cupos</span>
          <Input
            type="number"
            name="cupos"
            min={1}
            defaultValue={1}
            className={cn("w-full", SIN_SPINNERS)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">
            Horas/semana <span className="text-muted/70">(opcional)</span>
          </span>
          <Input
            type="number"
            name="horas_semanales"
            min={1}
            max={60}
            placeholder="Ej: 10"
            className={cn("w-full", SIN_SPINNERS)}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">
          Descripción <span className="text-muted/70">(opcional)</span>
        </span>
        <Textarea
          name="descripcion"
          placeholder="Qué hace este rol en el proyecto"
          className="min-h-20"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">
          Habilidades requeridas <span className="text-muted/70">(opcional)</span>
        </span>
        <NewRoleSkillsPicker catalog={catalog} />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <SubmitButton className="min-h-11 w-full" pendingText="Agregando…">Agregar rol</SubmitButton>
      </div>
      </fieldset>
    </form>
  );
}
