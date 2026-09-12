"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/features/profile/actions";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/features/auth/components/submit-button";

const INITIAL: ProfileState = {};

/**
 * Versión mínima de `ProfileForm` para cuentas de patrocinador: solo el
 * nombre. Reusa la misma `updateProfile` — los demás campos (carrera, bio,
 * enlaces…) llegan vacíos y quedan en null, que ya es su estado actual.
 */
export function PatrocinadorProfileForm({ nombre }: { nombre: string }) {
  const [state, formAction] = useActionState(updateProfile, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Nombre</span>
        <Input name="nombre" required defaultValue={nombre} />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Guardando…">Guardar</SubmitButton>
    </form>
  );
}
