import type { ReactNode } from "react";
import { AuthEntryShell } from "@/features/auth/components/auth-entry-shell";
import { getPublishedProjects } from "@/features/projects/queries";

/**
 * Layout compartido de /ingresar y /registro: el marco y el panel de marca
 * no se desmontan al navegar entre ambos, así el cambio no se siente brusco.
 */
export default async function CredentialsLayout({
  children,
}: {
  children: ReactNode;
}) {
  let projects: Awaited<ReturnType<typeof getPublishedProjects>> = [];
  try {
    projects = await getPublishedProjects();
  } catch {
    projects = [];
  }

  return (
    <AuthEntryShell projects={projects.slice(0, 3)}>{children}</AuthEntryShell>
  );
}
