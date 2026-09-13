"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  Button,
  type ButtonVariant,
  type ButtonSize,
} from "@/components/ui/button";

/**
 * Botón de envío consciente del estado del formulario: mientras la Server Action
 * está en curso se deshabilita (evita doble envío) y muestra un spinner con un
 * texto opcional. Usa `useFormStatus`, así que debe renderizarse DENTRO del
 * `<form>` cuyo envío observa. Reutilizable en cualquier formulario (acepta las
 * mismas variantes/tamaños que `Button`).
 */
export function SubmitButton({
  children,
  pendingText,
  variant,
  size,
  className,
  disabled,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={pending || disabled}
      aria-busy={pending}
    >
      {pending && <Spinner />}
      {pending ? pendingText ?? children : children}
    </Button>
  );
}

/** Indicador de carga circular. `currentColor` hereda el color del botón. */
function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
      />
    </svg>
  );
}
