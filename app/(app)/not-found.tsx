import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página no encontrada · Vardelab",
};

/**
 * 404 del área autenticada: `app/not-found.tsx` (fondo oscuro, header propio,
 * pensado para el sitio público) se veía roto acá adentro — el layout de
 * `(app)` sigue montando el sidebar alrededor de cualquier not-found.tsx que
 * no viva en este mismo segmento, así que quedaban mezclados. Esta versión es
 * liviana y usa los mismos tokens que el resto del panel.
 */
export default function AppNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">
        Error 404
      </span>
      <h1 className="mt-2 text-2xl font-bold text-ink">
        No encontramos esta página
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
        El enlace puede estar mal escrito, o la página ya no existe.
      </p>
      <Link
        href="/inicio"
        className="mt-5 text-sm font-medium text-electric hover:underline"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
