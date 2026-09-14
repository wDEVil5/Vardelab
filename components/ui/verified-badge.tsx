import { cn } from "@/lib/utils";

/**
 * Sello de organización verificada (ícono tipo "check badge"). Modo icónico,
 * al estilo de las marcas de verificación de redes. Toma el color de `className`
 * (por defecto el azul de marca) y muestra un tooltip "Verificado" al pasar el
 * mouse o enfocar con teclado (CSS puro, sin JS). Trae etiqueta accesible.
 *
 * El grupo lleva nombre propio (`group/verified`) a propósito: sin nombre,
 * `group-hover` responde a CUALQUIER ancestro con clase `group` (por ejemplo
 * la tarjeta u organización que lo envuelve), no solo a este `<span>` — el
 * tooltip aparecía con pasar el mouse por la tarjeta entera, no solo por el
 * sello.
 */
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span className="group/verified relative inline-flex shrink-0" tabIndex={0}>
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        role="img"
        aria-label="Organización verificada"
        className={cn("size-4 shrink-0 text-electric", className)}
      >
        <path
          fillRule="evenodd"
          d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
          clipRule="evenodd"
        />
      </svg>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-all duration-150 group-hover/verified:translate-y-0 group-hover/verified:opacity-100 group-focus-visible/verified:translate-y-0 group-focus-visible/verified:opacity-100"
      >
        Verificado
      </span>
    </span>
  );
}

/**
 * Marcador de "todavía no verificada" (M62): un círculo punteado, sin color
 * ni relleno, en el mismo lugar donde iría el sello azul una vez aprobada —
 * al estilo de la insignia vacía que Instagram muestra junto al nombre de una
 * cuenta profesional antes de verificarla. Va solo en el perfil de la propia
 * organización (`/mis-organizaciones/[id]/editar`), nunca en la ficha pública:
 * es una señal para quien gestiona la organización, no para quien la visita.
 */
export function PendingVerificationBadge({
  className,
  estado,
}: {
  className?: string;
  estado: "sin_verificar" | "en_revision";
}) {
  const label = estado === "en_revision" ? "Verificación en revisión" : "Sin verificar";

  return (
    <span className="group/pending relative inline-flex shrink-0" tabIndex={0}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        role="img"
        aria-label={label}
        className={cn("size-4 shrink-0 text-muted", className)}
      >
        <path
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2 2.1"
          d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
        />
      </svg>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-all duration-150 group-hover/pending:translate-y-0 group-hover/pending:opacity-100 group-focus-visible/pending:translate-y-0 group-focus-visible/pending:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
