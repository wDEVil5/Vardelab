"use client";

import { useActionState, useState } from "react";
import { changePassword, type UpdatePasswordState } from "@/features/auth/actions";
import { Input } from "@/components/ui/input";
import { PasswordField } from "./password-field";
import { SubmitButton } from "./submit-button";

const INITIAL: UpdatePasswordState = {};

// Campo de contraseña simple con mostrar/ocultar, sin la lista de requisitos
// (esa es solo para la contraseña NUEVA, en `PasswordField`) — para la actual
// y la confirmación basta con poder verla mientras se escribe.
function TogglePasswordInput({
  label,
  name,
  autoComplete,
}: {
  label: string;
  name: string;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          name={name}
          autoComplete={autoComplete}
          required
          className="pr-16"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted hover:text-electric"
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
    </label>
  );
}

/**
 * Cambia la contraseña con la sesión ya activa (dentro de un modal en
 * /perfil). Pide la contraseña actual (la Server Action re-autentica con
 * ella antes de cambiarla) y confirmar la nueva, para no dejar pasar un
 * error de tipeo.
 */
export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePassword, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TogglePasswordInput
        label="Contraseña actual"
        name="currentPassword"
        autoComplete="current-password"
      />

      <PasswordField />

      <TogglePasswordInput
        label="Confirmar contraseña nueva"
        name="confirmPassword"
        autoComplete="new-password"
      />

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Guardando…">Guardar contraseña</SubmitButton>
    </form>
  );
}
