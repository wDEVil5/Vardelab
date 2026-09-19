import type { ReactNode } from "react";
import { AuthEntryShell } from "@/features/auth/components/auth-entry-shell";

/**
 * Layout compartido de /ingresar y /registro: el marco y el panel de marca
 * no se desmontan al navegar entre ambos, así el cambio no se siente brusco.
 */
export default function CredentialsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AuthEntryShell>{children}</AuthEntryShell>;
}
