import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { createOrganization } from "@/features/organizations/actions";
import { OrgForm } from "@/features/organizations/components/org-form";

export const metadata: Metadata = {
  title: "Nueva organización · CampusLab",
};

/** Alta de organización. Requiere sesión de patrocinador. */
export default async function NuevaOrganizacionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?next=/mis-organizaciones/nueva");
  if (!user.esPatrocinador) redirect("/proyectos");

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
      <Link
        href="/mis-organizaciones"
        className="text-sm text-muted transition-colors hover:text-electric"
      >
        ← Volver a mis organizaciones
      </Link>

      <header className="mt-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Nueva organización</h1>
        <p className="text-sm text-muted">
          Bajo tu organización publicarás los proyectos. Se crea sin verificar;
          la verificación llega más adelante.
        </p>
      </header>

      <div className="mt-8">
        <OrgForm
          action={createOrganization}
          submitLabel="Crear organización"
          pendingText="Creando…"
        />
      </div>
    </main>
  );
}
