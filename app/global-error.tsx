"use client";

import { useEffect } from "react";

/**
 * Último resguardo: solo se monta si el propio layout raíz (`app/layout.tsx`)
 * falla. Por eso define su propio `<html>/<body>` y evita depender de
 * cualquier otra pieza de la app (fuentes, componentes, `globals.css`) — si
 * el layout raíz está roto, más vale no confiar en nada más.
 */
export default function GlobalError({
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
    <html lang="es">
      <body
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#0a1420",
          color: "#fff",
        }}
      >
        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>
          Algo salió mal.
        </p>
        <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.7, maxWidth: "24rem" }}>
          No fue tu culpa. Intenta de nuevo.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            border: "none",
            borderRadius: "0.375rem",
            background: "#3867ff",
            color: "#fff",
            padding: "0.625rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
