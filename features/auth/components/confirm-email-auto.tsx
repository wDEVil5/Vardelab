"use client";

import { useEffect, useRef } from "react";
import { confirmEmailCode } from "@/features/auth/actions";

/**
 * Dispara `confirmEmailCode` apenas se monta, sin esperar un clic — la
 * protección contra el escaneo de links de Gmail está en que esto requiere
 * ejecutar JavaScript, no en pedirle un clic extra a la persona (ver el
 * comentario de `confirmEmailCode`). `confirmEmailCode` siempre devuelve un
 * `redirectTo` (con o sin error) — ese destino (`/ingresar` o `/recuperar`)
 * ya sabe mostrar el mensaje de error con el mismo estilo que el resto de
 * la auth, así que acá no hace falta un estado de error propio.
 */
export function ConfirmEmailAuto({ code, next }: { code: string; next: string }) {
  const disparado = useRef(false);

  useEffect(() => {
    if (disparado.current) return;
    disparado.current = true;

    confirmEmailCode(code, next).then((result) => {
      window.location.href = result.redirectTo;
    });
  }, [code, next]);

  return (
    <div className="flex items-center gap-2.5 text-sm text-muted">
      <svg
        className="size-4 shrink-0 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
      </svg>
      Confirmando tu cuenta…
    </div>
  );
}
