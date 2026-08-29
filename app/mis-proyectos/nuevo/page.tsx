import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/features/auth/queries";
import { getMyOrganizations } from "@/features/organizations/queries";
import { createProject } from "@/features/projects/actions";
import { ProjectForm } from "@/features/projects/components/project-form";

export const metadata: Metadata = {
  title: "Nuevo proyecto · CampusLab",
};

/** Alta de proyecto. Requiere sesión de patrocinador con al menos una organización. */
export default async function NuevoProyectoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?next=/mis-proyectos/nuevo");
  if (!user.esPatrocinador) redirect("/proyectos");

  const organizations = await getMyOrganizations();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
      <Link
        href="/mis-proyectos"
        className="text-sm text-muted transition-colors hover:text-electric"
      >
        ← Volver a mis proyectos
      </Link>

      <header className="mt-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Nuevo proyecto</h1>
        <p className="text-sm text-muted">
          Se guarda como borrador. Luego podrás agregar roles y publicarlo.
        </p>
      </header>

      <div className="mt-8">
        {organizations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface/50 px-6 py-12 text-center">
            <p className="font-medium text-ink">
              Todavía no tienes una organización
            </p>
            <p className="mt-1 text-sm text-muted">
              Un proyecto se crea bajo una organización. Crea la tuya para
              empezar.
            </p>
            <Link
              href="/mis-organizaciones/nueva"
              className={cn(
                "mt-4 inline-flex",
                buttonClasses({ variant: "primary", size: "sm" }),
              )}
            >
              Crear organización
            </Link>
          </div>
        ) : (
          <ProjectForm
            action={createProject}
            submitLabel="Crear proyecto"
            pendingText="Creando…"
            organizations={organizations}
          />
        )}
      </div>
    </main>
  );
}
