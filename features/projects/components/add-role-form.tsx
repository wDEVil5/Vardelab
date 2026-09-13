"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addRole, type AddRoleState } from "@/features/projects/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/features/auth/components/submit-button";
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
 * de una (antes había que crear el rol y recién ahí, aparte, agregarle cada
 * habilidad). Al agregarse con éxito (sin error tras un envío) limpia los
 * campos para cargar el siguiente rol — `resetKey` fuerza a remontar
 * `NewRoleSkillsPicker` en ese momento, porque su estado es local y un
 * `form.reset()` normal no lo toca.
 */
export function AddRoleForm({
  projectId,
  catalog,
}: {
  projectId: string;
  catalog: Skill[];
}) {
  const [state, formAction] = useActionState(addRole, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const [resetKey, setResetKey] = useState(0);
  // Marca si ya hubo al menos un envío, para no limpiar en el montaje inicial.
  const enviado = useRef(false);

  useEffect(() => {
    if (enviado.current && !state.error) {
      formRef.current?.reset();
      setResetKey((k) => k + 1);
    }
    enviado.current = true;
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="projectId" value={projectId} />

      <div className="grid gap-4 sm:grid-cols-[1fr_6rem_11rem]">
        <label className="flex flex-col gap-1.5">
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
        <NewRoleSkillsPicker key={resetKey} catalog={catalog} />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <div>
        <SubmitButton pendingText="Agregando…">Agregar rol</SubmitButton>
      </div>
    </form>
  );
}
