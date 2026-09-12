"use client";

import { useRef, useTransition } from "react";
import { Switch } from "@/components/ui/switch";

/**
 * Interruptor de visibilidad del perfil: envía el mismo server action que
 * antes disparaba un botón de texto ("Hacer público"/"Hacer privado"), pero
 * como un switch — más discreto para un ajuste que se prende o apaga.
 */
export function VisibilityToggle({
  checked,
  action,
}: {
  checked: boolean;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action}>
      <input
        type="hidden"
        name="visibility"
        value={checked ? "privado" : "publico"}
      />
      <Switch
        checked={checked}
        disabled={pending}
        label={checked ? "Hacer perfil privado" : "Hacer perfil público"}
        onChange={() => startTransition(() => formRef.current?.requestSubmit())}
      />
    </form>
  );
}
