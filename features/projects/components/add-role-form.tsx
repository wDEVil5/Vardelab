"use client";

import { useActionState, useEffect, useRef } from "react";
import { addRole, type AddRoleState } from "@/features/projects/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/features/auth/components/submit-button";

const INITIAL: AddRoleState = {};

/**
 * Formulario para agregar un rol a un proyecto. Al agregarse con éxito
 * (sin error tras un envío) limpia los campos para cargar el siguiente rol.
 */
export function AddRoleForm({ projectId }: { projectId: string }) {
  const [state, formAction] = useActionState(addRole, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  // Marca si ya hubo al menos un envío, para no limpiar en el montaje inicial.
  const enviado = useRef(false);

  useEffect(() => {
    if (enviado.current && !state.error) {
      formRef.current?.reset();
    }
    enviado.current = true;
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-border bg-white p-5"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <p className="text-sm font-medium text-ink">Agregar un rol</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input name="nombre" required placeholder="Nombre del rol (ej: Frontend)" />
        <Input
          type="number"
          name="cupos"
          min={1}
          defaultValue={1}
          className="sm:max-w-24"
          aria-label="Cupos"
          placeholder="Cupos"
        />
        <Input
          type="number"
          name="horas_semanales"
          min={1}
          max={60}
          className="sm:max-w-36"
          aria-label="Horas por semana"
          placeholder="Horas/semana"
        />
      </div>

      <Textarea
        name="descripcion"
        placeholder="Qué hace este rol en el proyecto (opcional)"
        className="min-h-16"
      />

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
