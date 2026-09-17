import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Paginación genérica (catálogo público P-02, tabla de proyectos del admin).
 * Server Component puro: cada página es un link normal (?page=N conservando
 * el resto de los filtros de quien la usa), sin JS.
 */
export function Pagination({
  page,
  totalPages,
  hrefForPage,
  label = "Paginación",
  className,
}: {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
  label?: string;
  /** Reemplaza el `mt-8` por defecto — útil cuando el padre ya da el espacio
   * (ej. un `flex flex-col gap-*`). */
  className?: string;
}) {
  if (totalPages <= 1) return null;

  // Ventana de hasta 5 números centrada en la página actual.
  const inicio = Math.max(1, Math.min(page - 2, totalPages - 4));
  const fin = Math.min(totalPages, inicio + 4);
  const numeros = Array.from(
    { length: fin - inicio + 1 },
    (_, i) => inicio + i,
  );

  const boton = (activo: boolean) =>
    cn(
      "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors",
      activo
        ? "bg-ink text-white"
        : "text-ink hover:bg-electric/10",
    );

  const botonDeshabilitado =
    "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium text-muted/50";

  return (
    <nav
      aria-label={label}
      className={cn("flex items-center justify-center gap-1", className ?? "mt-8")}
    >
      {page > 1 ? (
        <Link href={hrefForPage(page - 1)} className={boton(false)} aria-label="Página anterior">
          ← Anterior
        </Link>
      ) : (
        <span className={botonDeshabilitado} aria-hidden>
          ← Anterior
        </span>
      )}

      {inicio > 1 && (
        <>
          <Link href={hrefForPage(1)} className={boton(false)}>
            1
          </Link>
          {inicio > 2 && <span className="px-1 text-muted">…</span>}
        </>
      )}

      {numeros.map((n) => (
        <Link
          key={n}
          href={hrefForPage(n)}
          className={boton(n === page)}
          aria-current={n === page ? "page" : undefined}
        >
          {n}
        </Link>
      ))}

      {fin < totalPages && (
        <>
          {fin < totalPages - 1 && <span className="px-1 text-muted">…</span>}
          <Link href={hrefForPage(totalPages)} className={boton(false)}>
            {totalPages}
          </Link>
        </>
      )}

      {page < totalPages ? (
        <Link href={hrefForPage(page + 1)} className={boton(false)} aria-label="Página siguiente">
          Siguiente →
        </Link>
      ) : (
        <span className={botonDeshabilitado} aria-hidden>
          Siguiente →
        </span>
      )}
    </nav>
  );
}
