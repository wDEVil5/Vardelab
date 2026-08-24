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
}: {
  children: React.ReactNode;
  pendingText: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? pendingText : children}
    </Button>
  );
}
