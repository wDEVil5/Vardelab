"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { toggleObservationResuelta } from "@/features/projects/actions";

/**
 * Marca una observación puntual como resuelta (S-07). Botón tipo casilla de
 * checklist, no un `Switch`: acá no es una preferencia on/off, es una tarea
 * que se completó o no — el texto ("Resuelta" / "Marcar como resuelta") dice
 * el estado, no solo el color. Llama a la acción del servidor directamente
 * con un `FormData` para actualizar el contador de la pantalla al toque, sin
 * esperar la revalidación.
 */
export function ObservationToggle({
  observationId,
  projectId,
  resuelta,
  onChange,
}: {
  observationId: string;
  projectId: string;
  resuelta: boolean;
  onChange?: (resuelta: boolean) => void;
}) {
  const [checked, setChecked] = useState(resuelta);
  const [pending, startTransition] = useTransition();

  const alternar = () => {
    const next = !checked;
    setChecked(next);
    onChange?.(next);
    const formData = new FormData();
    formData.set("observationId", observationId);
    formData.set("projectId", projectId);
    if (next) formData.set("resuelta", "on");
    startTransition(() => {
      toggleObservationResuelta(formData);
    });
  };

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={pending}
      aria-pressed={checked}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
        checked
          ? "border-sprout/30 bg-sprout/15 text-ink"
          : "border-border bg-white text-muted hover:border-electric hover:text-electric",
      )}
    >
      {checked && (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 text-sprout"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )}
      {checked ? "Resuelta" : "Marcar como resuelta"}
    </button>
  );
}
