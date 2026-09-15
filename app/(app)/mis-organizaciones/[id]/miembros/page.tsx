import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { OrgLogo } from "@/components/ui/org-logo";
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

function IconPersonas({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

type PageProps = { params: Promise<{ id: string }> };

/**
 * Miembros de una organización (M37/M38): invitar por correo y ver quién ya
 * tiene acceso (o está esperando registrarse). Todos con el mismo nivel que
 * el dueño — no hay roles internos todavía. Se llega acá desde la tarjeta
 * "Miembros" en /editar (activada 2026-09-15); no tiene entrada propia en el
 * sidebar, vive dentro del flujo de edición de la organización.
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

      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-white p-6">
        <OrgLogo logoUrl={org.logo_url} nombre={org.nombre} size="lg" />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium tracking-wide text-muted uppercase">
            Miembros de
          </span>
          <h1 className="text-lg font-bold text-ink">{org.nombre}</h1>
        </div>
      </div>

      <p className="mt-5 text-sm text-muted">
        Quién puede gestionar {org.nombre}: sus proyectos, postulaciones,
        hitos y evaluaciones. Todos con el mismo nivel de acceso.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex items-start gap-4 bg-electric/5 p-7">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-electric shadow-sm">
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

      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-semibold text-ink">
          {miembros.length > 0
            ? `${miembros.length} miembro${miembros.length === 1 ? "" : "s"}`
            : "Miembros"}
        </h2>
        {miembros.length > 0 && (
          <span className="text-xs text-muted">
            {miembros.filter((m) => m.status === "activo").length} con acceso ·{" "}
            {miembros.filter((m) => m.status !== "activo").length} pendiente
            {miembros.filter((m) => m.status !== "activo").length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {miembros.length === 0 ? (
        <div className="mt-3 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-white text-muted shadow-sm">
            <IconPersonas className="size-5" />
          </span>
          <p className="mt-1 font-medium text-ink">Por ahora nadie más gestiona esta organización</p>
          <p className="text-sm text-muted">
            Invítalos por correo arriba para que co-gestionen {org.nombre}.
          </p>
        </div>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {miembros.map((m) => {
            const estado = ESTADO[m.status] ?? {
              label: m.status,
              tone: "neutral" as BadgeTone,
            };
            const activo = m.status === "activo";
            return (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 transition-all hover:border-electric/30 hover:shadow-sm"
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
  );
}
