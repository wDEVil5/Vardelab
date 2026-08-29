import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Botón de acción. Se expone también `buttonClasses` para que un enlace
 * (`next/link`) pueda tomar la misma apariencia sin duplicar estilos.
 */

const variantClasses = {
  primary: "bg-electric text-white hover:bg-electric/90",
  secondary: "bg-surface text-ink hover:bg-border",
  ghost: "text-electric hover:bg-electric/10",
  danger: "bg-coral text-white hover:bg-coral/90",
} as const;

const sizeClasses = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
} as const;

export type ButtonVariant = keyof typeof variantClasses;
export type ButtonSize = keyof typeof sizeClasses;

type ButtonStyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function buttonClasses({
  variant = "primary",
  size = "md",
}: ButtonStyleOptions = {}): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric",
    "disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
  );
}

type ButtonProps = ComponentProps<"button"> & ButtonStyleOptions;

export function Button({
  variant,
  size,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonClasses({ variant, size }), className)}
      {...props}
    />
  );
}
