"use client";

import { useActionState } from "react";
import { applyToRole, type ApplyState } from "@/features/applications/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/features/auth/components/submit-button";

const INITIAL: ApplyState = {};

/**
 * Formulario de postulación (E-03). `projectId` y `roleId` viajan como campos
 * ocultos para que la Server Action sepa a qué rol se postula y a dónde volver.
 */
export function ApplyForm({
  projectId,
  roleId,
}: {
  projectId: string;
  roleId: string;
}) {
  const [state, formAction] = useActionState(applyToRole, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="roleId" value={roleId} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Mensaje</span>
        <Textarea
          name="mensaje"
          required
          placeholder="Cuenta por qué te interesa este rol y qué puedes aportar."
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">
          Enlace relevante <span className="text-muted">(opcional)</span>
        </span>
        <Input
          type="url"
          name="evidencia"
          placeholder="https://… portafolio, repositorio o trabajo previo"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">
          Disponibilidad <span className="text-muted">(opcional)</span>
        </span>
        <Input
          type="text"
          name="disponibilidad"
          placeholder="Ej: 8 horas semanales, tardes"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Enviando…">Enviar postulación</SubmitButton>
    </form>
  );
}
