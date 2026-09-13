import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { getCurrentUser } from "@/features/auth/queries";
import { getMyOrganization } from "@/features/organizations/queries";
import { updateOrganization } from "@/features/organizations/actions";
import { OrgForm } from "@/features/organizations/components/org-form";
import { OrgLogoPicker } from "@/features/organizations/components/org-logo-picker";
import { DeleteOrgButton } from "@/features/organizations/components/delete-org-button";

export const metadata: Metadata = {
  title: "Perfil de organización · CampusLab",
};

const TIPO_LABEL: Record<string, string> = {
  academica: "Académica",
  social: "Social",
  emprendimiento: "Emprendimiento",
  empresa: "Empresa",
  interna: "Interna",
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guardado?: string }>;
};

/** Perfil de organización (S-01): identidad visible y datos de contacto. */
export default async function EditarOrganizacionPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { guardado } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect(`/ingresar?next=/mis-organizaciones/${id}/editar`);
  if (!user.esPatrocinador) redirect("/proyectos");

  const org = await getMyOrganization(id);
  if (!org) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:py-10">
      <Link
        href="/mis-organizaciones"
        className="text-sm text-muted transition-colors hover:text-electric"
      >
        ← Volver a mis organizaciones
      </Link>

      <header className="mt-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink">Perfil de organización</h1>
        <p className="text-sm text-muted">
          Identidad visible y datos de contacto para estudiantes.
        </p>
      </header>

      {guardado === "1" && (
        <div className="mt-6 rounded-lg border border-sprout/30 bg-sprout/10 px-4 py-3 text-sm text-ink">
          Cambios guardados.
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-5 rounded-2xl border border-border bg-white p-6">
        <OrgLogoPicker orgId={org.id} logoUrl={org.logo_url} nombre={org.nombre} />
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-lg font-bold text-ink">
            {org.nombre}
            {org.verificacion === "verificado" && <VerifiedBadge />}
          </span>
          <span className="text-sm text-muted">
            {TIPO_LABEL[org.tipo] ?? org.tipo}
          </span>
          {org.verificacion !== "verificado" && (
            <span className="text-xs text-muted">
              {org.verificacion === "en_revision"
                ? "Verificación en revisión"
                : "Sin verificar"}
            </span>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="rounded-2xl border border-border bg-white p-8">
          <h2 className="text-lg font-semibold text-ink">
            Información institucional
          </h2>
          <div className="mt-5">
            <OrgForm
              action={updateOrganization}
              submitLabel="Guardar cambios"
              pendingText="Guardando…"
              org={org}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6">
          <span className="font-semibold text-ink">Visibilidad</span>
          <p className="text-sm text-muted">
            Los estudiantes verán esta información al revisar tus proyectos.
          </p>
          <Badge tone="success" className="w-fit">
            Perfil público
          </Badge>
        </div>
      </div>

      <div className="mt-10">
        <DeleteOrgButton orgId={org.id} />
      </div>
    </div>
  );
}
