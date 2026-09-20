"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Boundary de errores del área autenticada: el layout de `(app)` sigue
 * montando el sidebar alrededor de cualquier error.tsx que no viva en este
 * mismo segmento (mismo motivo que `(app)/not-found.tsx`), así que este usa
 * los tokens del panel en vez del estilo oscuro del sitio público.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">
        Error inesperado
      </span>
      <h1 className="mt-2 text-2xl font-bold text-ink">Algo salió mal</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
        No fue tu culpa. Intenta de nuevo o vuelve al inicio.
      </p>
      <div className="mt-5 flex items-center gap-5">
        <button
          type="button"
          onClick={reset}
          className="text-sm font-medium text-electric hover:underline"
        >
          Reintentar
        </button>
        <Link href="/inicio" className="text-sm font-medium text-electric hover:underline">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
