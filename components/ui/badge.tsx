import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Etiqueta compacta para metadatos: modalidad, estado de verificación,
 * nivel de habilidad, etc. Puramente presentacional.
 */

const toneClasses = {
  // Gris suave: metadatos neutrales (modalidad, duración).
  neutral: "bg-surface text-muted",
  // Marca: destaca sin ser una acción.
  brand: "bg-electric/10 text-electric",
  // Éxito: organización verificada, postulación aceptada.
  success: "bg-sprout/15 text-ink",
  // Alerta: postulación rechazada, estados negativos.
  danger: "bg-coral/15 text-ink",
  // Contorno: chips de habilidad sobre fondos claros.
  outline: "border border-border text-muted",
} as const;

export type BadgeTone = keyof typeof toneClasses;

type BadgeProps = ComponentProps<"span"> & {
  tone?: BadgeTone;
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
