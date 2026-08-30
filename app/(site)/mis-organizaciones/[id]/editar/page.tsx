import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { getMyOrganization } from "@/features/organizations/queries";
import { updateOrganization } from "@/features/organizations/actions";
import { OrgForm } from "@/features/organizations/components/org-form";
import { DeleteOrgButton } from "@/features/organizations/components/delete-org-button";

export const metadata: Metadata = {
  title: "Editar organización · CampusLab",
};

type PageProps = { params: Promise<{ id: string }> };

/** Edición de una organización propia. Requiere sesión de patrocinador dueño. */
export default async function EditarOrganizacionPage({ params }: PageProps) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/ingresar?next=/mis-organizaciones/${id}/editar`);
  if (!user.esPatrocinador) redirect("/proyectos");

  const org = await getMyOrganization(id);
  if (!org) notFound();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
      <Link
        href="/mis-organizaciones"
        className="text-sm text-muted transition-colors hover:text-electric"
      >
        ← Volver a mis organizaciones
      </Link>

      <header className="mt-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Editar organización</h1>
        <p className="text-sm text-muted">
          La verificación no se edita aquí; la gestiona la moderación.
        </p>
      </header>

      <div className="mt-8">
        <OrgForm
          action={updateOrganization}
          submitLabel="Guardar cambios"
          pendingText="Guardando…"
          org={org}
        />
      </div>

      <div className="mt-10">
        <DeleteOrgButton orgId={org.id} />
      </div>
    </main>
  );
}
