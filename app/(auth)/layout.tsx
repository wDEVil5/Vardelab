import type { ReactNode } from "react";

/**
 * Layout de autenticación (login/registro): pantalla completa, sin el header
 * global. Fondo ink desde el primer paint para evitar el flash blanco del body
 * (`:root --background: #fff`) mientras carga el split.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-ink text-white">{children}</div>;
}
