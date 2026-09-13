import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

// Iniciales para el avatar del miembro (o "?" si todavía no hay nombre).
function iniciales(nombre: string | null): string {
  if (!nombre) return "?";
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  return partes.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function IconSobre({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function IconReloj({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

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

      <div className="mt-8 rounded-2xl border border-border bg-white p-7">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-electric/10 text-electric">
            <IconSobre className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-ink">Invitar por correo</h2>
            <p className="mt-1 text-sm text-muted">
              Si ya tiene cuenta en CampusLab queda activo de una; si no,
              apenas se registre con ese correo.
            </p>
            <div className="mt-4">
              <InviteMemberForm orgId={org.id} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-white p-7">
        <h2 className="font-semibold text-ink">
          {miembros.length > 0
            ? `${miembros.length} miembro${miembros.length === 1 ? "" : "s"}`
            : "Miembros"}
        </h2>

        {miembros.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Por ahora nadie más gestiona esta organización.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {miembros.map((m) => {
              const estado = ESTADO[m.status] ?? {
                label: m.status,
                tone: "neutral" as BadgeTone,
              };
              const activo = m.status === "activo";
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-4 transition-all hover:border-electric/30 hover:shadow-sm"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      activo ? "bg-electric/10 text-electric" : "bg-surface text-muted",
                    )}
                  >
                    {activo ? iniciales(m.nombre) : <IconReloj className="size-4" />}
                  </span>
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
