"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import { signOut } from "@/features/auth/actions";

type State = { ok?: boolean };
const INITIAL: State = {};

/**
 * Reemplazo directo de `<form action={signOut}>`: navegación dura al cerrar
 * sesión (mismo criterio que `LoginForm` para el login) — si no, el Router
 * Cache del cliente puede servir por un instante una página ya renderizada
 * en la sesión anterior (ej. una vista de admin) al entrar enseguida con
 * otra cuenta en la misma pestaña.
 */
export function SignOutForm({ children }: { children: ReactNode }) {
  const [state, formAction] = useActionState(async (): Promise<State> => {
    await signOut();
    return { ok: true };
  }, INITIAL);

  useEffect(() => {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intencional, ver comentario de arriba (mismo criterio que LoginForm)
    if (state.ok) window.location.href = "/";
  }, [state.ok]);

  return <form action={formAction}>{children}</form>;
}
