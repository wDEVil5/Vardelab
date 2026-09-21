"use client";

import { useActionState, useRef } from "react";
import { Switch } from "@/components/ui/switch";

/**
 * Interruptor de visibilidad del perfil: envía el mismo server action que
 * antes disparaba un botón de texto ("Hacer público"/"Hacer privado"), pero
 * como un switch — más discreto para un ajuste que se prende o apaga.
 *
 * `useActionState` en vez de `useTransition` a secas: antes, si el update
 * fallaba en el servidor, el error solo quedaba logueado — el switch
 * simplemente no cambiaba y nadie se enteraba por qué.
 */
export function VisibilityToggle({
  checked,
  action,
}: {
  checked: boolean;
  action: (
    prevState: { error?: string },
    formData: FormData,
  ) => Promise<{ error?: string }>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div>
      <form ref={formRef} action={formAction}>
        <input
          type="hidden"
          name="visibility"
          value={checked ? "privado" : "publico"}
        />
        <Switch
          checked={checked}
          disabled={pending}
          label={checked ? "Hacer perfil privado" : "Hacer perfil público"}
          onChange={() => formRef.current?.requestSubmit()}
        />
      </form>
      {state.error && (
        <p role="alert" className="mt-1 text-xs text-coral">
          {state.error}
        </p>
      )}
    </div>
  );
}
