"use client";

import { useActionState } from "react";
import {
  requestPasswordReset,
  type ResetRequestState,
} from "@/features/auth/actions";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "./submit-button";

const INITIAL: ResetRequestState = {};

/**
 * Pide el correo para enviar el enlace de recuperación. Siempre termina en
 * el mismo mensaje de éxito (la Server Action no distingue si el correo
 * existe o no), así que no hay nada que reintentar tras enviarlo.
 */
export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordReset, INITIAL);

  if (state.ok) {
    return (
      <p className="text-sm text-ink">
        Si ese correo tiene una cuenta, te enviamos un enlace para
        restablecer tu contraseña. Revisa tu bandeja de entrada (y spam).
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Correo</span>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="tucorreo@ejemplo.cl"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Enviando…">Enviar enlace</SubmitButton>
    </form>
  );
}
