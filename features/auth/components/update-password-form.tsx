"use client";

import { useActionState } from "react";
import {
  updatePassword,
  type UpdatePasswordState,
} from "@/features/auth/actions";
import { PasswordField } from "./password-field";
import { SubmitButton } from "./submit-button";

const INITIAL: UpdatePasswordState = {};

/** Define la nueva contraseña tras abrir el enlace de recuperación. */
export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(updatePassword, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <PasswordField />

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Guardando…">Guardar contraseña</SubmitButton>
    </form>
  );
}
