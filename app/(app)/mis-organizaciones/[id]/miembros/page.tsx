import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/queries";
import {
  getMyOrganization,
  getOrganizationMembers,
} from "@/features/organizations/queries";
import { removeOrganizationMember } from "@/features/organizations/actions";
import { InviteMemberForm } from "@/features/organizations/components/invite-member-form";

export const metadata: Metadata = {
  title: "Miembros de la organización · CampusLab",
};

const ESTADO: Record<string, { label: string; tone: BadgeTone }> = {
  activo: { label: "Activo", tone: "success" },
  pendiente: { label: "Invitación pendiente", tone: "neutral" },
};

type PageProps = { params: Promise<{ id: string }> };

/**
 * Miembros de una organización (M37/M38): invitar por correo y ver quién ya
 * tiene acceso (o está esperando registrarse). Todos con el mismo nivel que
 * el dueño — no hay roles internos todavía. Sin entrada visible en la
 * navegación por ahora (queda como "Próximamente" en /editar); esta página ya
 * funciona de punta a punta para cuando se active.
 */
export default async function MiembrosOrganizacionPage({ params }: PageProps) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/ingresar?next=/mis-organizaciones/${id}/miembros`);

  const org = await getMyOrganization(id);
  if (!org) notFound();

  const miembros = await getOrganizationMembers(id);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 lg:py-10">
      <Link
        href={`/mis-organizaciones/${id}/editar`}
        className="text-sm text-muted transition-colors hover:text-electric"
      >
        ← Volver al perfil de organización
      </Link>

      <header className="mt-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink">Miembros</h1>
        <p className="text-sm text-muted">
          Quién puede gestionar {org.nombre}: sus proyectos, postulaciones,
          hitos y evaluaciones. Todos con el mismo nivel de acceso.
        </p>
      </header>

      <div className="mt-8 rounded-2xl border border-border bg-white p-6">
        <h2 className="text-sm font-semibold text-ink">Invitar por correo</h2>
        <p className="mt-1 text-sm text-muted">
          Si ya tiene cuenta en CampusLab queda activo de una; si no, en
          cuanto se registre con ese correo.
        </p>
        <div className="mt-4">
          <InviteMemberForm orgId={org.id} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-white p-6">
        <h2 className="text-sm font-semibold text-ink">
          {miembros.length > 0 ? `${miembros.length} miembro${miembros.length === 1 ? "" : "s"}` : "Miembros"}
        </h2>

        {miembros.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Por ahora solo vos gestionás esta organización.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {miembros.map((m) => {
              const estado = ESTADO[m.status] ?? {
                label: m.status,
                tone: "neutral" as BadgeTone,
              };
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {m.nombre ?? m.invited_email}
                    </p>
                    {m.nombre && (
                      <p className="truncate text-xs text-muted">{m.invited_email}</p>
                    )}
                  </div>
                  <Badge tone={estado.tone}>{estado.label}</Badge>
                  <form action={removeOrganizationMember}>
                    <input type="hidden" name="memberId" value={m.id} />
                    <input type="hidden" name="orgId" value={org.id} />
                    <button
                      type="submit"
                      className={buttonClasses({ variant: "ghost", size: "sm" })}
                    >
                      Quitar
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
