"use client";

import { useActionState, useEffect, useState } from "react";
import { signIn, type AuthState } from "@/features/auth/actions";
import { POST_AUTH_REDIRECT } from "@/features/auth/constants";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "./submit-button";

const INITIAL: AuthState = {};

export function LoginForm({ redirectTo = POST_AUTH_REDIRECT }: { redirectTo?: string }) {
  const [state, formAction] = useActionState(signIn, INITIAL);
  const [visible, setVisible] = useState(false);

  // Navegación dura (no router.push): si el login viene del modal, una
  // navegación de Next normal no siempre cierra el slot @modal (mismo
  // problema que se resolvió para /recuperar) — el modal queda pegado
  // encima de la página de destino. Con esto se cierra siempre.
  // `redirectTo` es el `?next=` que las páginas protegidas agregan al
  // mandar a /ingresar, para volver ahí después de loguearse.
  useEffect(() => {
    if (state.ok) window.location.href = redirectTo;
  }, [state.ok, redirectTo]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Correo</span>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="tucorreo@ejemplo.cl"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">Contraseña</span>
          {/* <a> normal (no <Link>): /recuperar nunca debe abrirse como
              modal, así que fuerza una navegación dura en vez de la
              interceptada (ver app/@modal). */}
          <a
            href="/recuperar"
            className="text-xs font-medium text-electric hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>
        <div className="relative">
          <Input
            type={visible ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center text-muted transition-colors hover:text-electric"
          >
            {visible ? (
              <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 3l18 18M10.6 10.6a3 3 0 004 4M9.4 5.5A9.6 9.6 0 0112 5c6.5 0 10 7 10 7a15.6 15.6 0 01-3.2 4.1M6.6 6.6C4 8.3 2 12 2 12s3.5 7 10 7c1.4 0 2.6-.3 3.7-.8" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
            )}
          </button>
        </div>
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Ingresando…">Ingresar</SubmitButton>
    </form>
  );
}
