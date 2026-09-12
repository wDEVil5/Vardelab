"use client";

import { cn } from "@/lib/utils";

/**
 * Interruptor on/off (patrón "botón + estado", no un `<input type="checkbox">"
 * nativo) — el mockup de D-05 lo usa 8 veces y el estilo (riel azul/gris,
 * perilla blanca) no tiene equivalente nativo consistente entre navegadores.
 */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 appearance-none items-center rounded-full border-0 p-0 transition-colors",
        checked ? "bg-electric" : "bg-border",
        disabled && "opacity-50",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}
