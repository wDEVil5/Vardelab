"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/**
 * Botón de envío que se deshabilita y cambia el texto mientras la Server Action
 * está en curso. Debe renderizarse dentro del <form> cuyo envío observa
 * (useFormStatus lee el estado del form padre).
 */
export function SubmitButton({
  children,
  pendingText,
  forcePending = false,
}: {
  children: React.ReactNode;
  pendingText: string;
  /** Mantiene el estado "pendiente" aunque `useFormStatus` ya haya vuelto a
   * false — usado en el login para cubrir el instante entre que la Server
   * Action termina y el `window.location.href` de éxito realmente navega. */
  forcePending?: boolean;
}) {
  const { pending: formPending } = useFormStatus();
  const pending = formPending || forcePending;
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? pendingText : children}
    </Button>
  );
}
