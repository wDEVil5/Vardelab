"use client";

import { useActionState } from "react";
import { signIn, type AuthState } from "@/features/auth/actions";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "./submit-button";

const INITIAL: AuthState = {};

export function LoginForm() {
  const [state, formAction] = useActionState(signIn, INITIAL);

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

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Contraseña</span>
        <Input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Ingresando…">Ingresar</SubmitButton>
    </form>
  );
}
