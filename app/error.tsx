"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Boundary de errores para todo lo que no vive bajo `(app)` (que tiene el
 * suyo, con el sidebar montado — ver `(app)/error.tsx`). Mismo lenguaje
 * visual que `not-found.tsx` (fondo oscuro), sin el efecto de física: acá el
 * objetivo es recuperarse rápido, no entretener mientras se lee un 404.
 */
export default function Error({
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
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink px-6 py-16 text-center text-white">
      <span className="text-xs font-semibold uppercase tracking-wide text-white/50 sm:text-sm">
        Error inesperado
      </span>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        Algo salió mal.
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/60 sm:text-base">
        No fue tu culpa. Intenta de nuevo o vuelve al inicio.
      </p>
      <div className="mt-6 flex items-center gap-5">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-electric px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-electric/90"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="text-sm font-medium text-white underline decoration-white/30 underline-offset-4 transition-colors hover:text-sprout hover:decoration-sprout"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
