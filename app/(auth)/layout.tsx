import type { ReactNode } from "react";

/**
 * Layout de autenticación (login/registro): pantalla completa, sin el header
 * global. La marca vive dentro del propio panel de las pantallas.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
