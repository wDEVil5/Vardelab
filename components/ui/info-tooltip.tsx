import { cn } from "@/lib/utils";

/**
 * Ícono de ayuda (círculo con "!") que muestra una explicación corta al pasar
 * el mouse o enfocar con teclado. CSS puro (mismo patrón que `VerifiedBadge`),
 * sin JS: se puede poner al lado de cualquier campo o control que necesite
 * una aclaración rápida sin ocupar espacio permanente en la pantalla.
 *
 * Grupo con nombre propio (`group/tooltip`), mismo motivo que en
 * `VerifiedBadge`: sin nombre, un ancestro con clase `group` (una tarjeta,
 * un link) activaría este tooltip con solo pasarle el mouse por encima.
 */
export function InfoTooltip({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className="group/tooltip relative inline-flex shrink-0" tabIndex={0}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        role="img"
        aria-label={text}
        className={cn("size-4 shrink-0 text-muted", className)}
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <path d="M12 7.5h.01" />
      </svg>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 w-max max-w-56 -translate-x-1/2 translate-y-1 rounded-md bg-ink px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-all duration-150 group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100 group-focus-visible/tooltip:translate-y-0 group-focus-visible/tooltip:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
