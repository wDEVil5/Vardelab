"use client";

import { useActionState, useState } from "react";
import { requestEmailChange, type ChangeEmailState } from "@/features/auth/actions";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "./submit-button";

const INITIAL: ChangeEmailState = {};

/**
 * Pide cambiar el correo (dentro de un modal en /perfil). Pide la contraseña
 * actual (la Server Action re-autentica con ella) y el correo nuevo. No hay a
 * dónde redirigir al terminar — el cambio no se aplica todavía, así que en
 * éxito se muestra el aviso de qué falta en vez de cerrar el modal.
 */
export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, formAction] = useActionState(requestEmailChange, INITIAL);
  const [visible, setVisible] = useState(false);

  if (state.ok) {
    return (
      <p className="text-sm text-ink">
        Te enviamos un correo de confirmación a tu correo actual (
        <strong>{currentEmail}</strong>) y al nuevo. El cambio se aplica recién
        cuando confirmas desde los dos.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Nuevo correo</span>
        <Input type="email" name="newEmail" autoComplete="email" required />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Contraseña actual</span>
        <div className="relative">
          <Input
            type={visible ? "text" : "password"}
            name="currentPassword"
            autoComplete="current-password"
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

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Enviando…">Enviar confirmación</SubmitButton>
    </form>
  );
}
