import type { ReactNode } from "react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { OrgLogo } from "@/components/ui/org-logo";
import { VerifiedInfoBadge } from "@/components/ui/verified-info-popover";
import { cn } from "@/lib/utils";
import type { ProjectDetail } from "@/features/projects/queries";

const MODALIDAD_LABEL: Record<string, string> = {
  remoto: "Remoto",
  presencial: "Presencial",
  hibrido: "Híbrido",
};

const TIPO_LABEL: Record<string, string> = {
  academica: "Académica",
  social: "Social",
  emprendimiento: "Emprendimiento",
  empresa: "Empresa",
  interna: "Interna",
};

type ProjectAsideProps = {
  organization: ProjectDetail["organization"];
  modalidad: ProjectDetail["modalidad"];
  duracionSemanas: ProjectDetail["duracion_semanas"];
  horasMin: number | null;
  horasMax: number | null;
  cuposTotales: number;
  cuposRestantes: number;
  tieneRoles: boolean;
};

/**
 * Aside de la ficha (P-03).
 * Desktop (lg+): panel sticky completo como antes (org, Abierto, CTAs, meta).
 * Móvil: sin repetir la org del header; tipo + Abierto compactos, mismos CTAs/meta.
 */
export function ProjectAside({
  organization: org,
  modalidad,
  duracionSemanas,
  horasMin,
  horasMax,
  cuposTotales,
  cuposRestantes,
  tieneRoles,
}: ProjectAsideProps) {
  const dedicacion =
    horasMin === null
      ? null
      : horasMin === horasMax
        ? `~${horasMin} h/semana`
        : `~${horasMin}–${horasMax} h/semana`;

  const abiertoLabel =
    cuposRestantes > 0
      ? `Abierto · ${cuposRestantes} ${cuposRestantes === 1 ? "cupo" : "cupos"}`
      : "Abierto";

  const meta: { label: string; value: string; icon: ReactNode }[] = [];
  if (modalidad) {
    meta.push({
      label: "Modalidad",
      value: MODALIDAD_LABEL[modalidad] ?? modalidad,
      icon: <IconModalidad className="size-4" />,
    });
  }
  if (duracionSemanas) {
    meta.push({
      label: "Duración",
      value: `${duracionSemanas} ${duracionSemanas === 1 ? "semana" : "semanas"}`,
      icon: <IconCalendario className="size-4" />,
    });
  }
  if (dedicacion) {
    meta.push({
      label: "Dedicación",
      value: dedicacion,
      icon: <IconReloj className="size-4" />,
    });
  }
  if (cuposTotales > 0) {
    meta.push({
      label: "Equipo",
      value: `${cuposTotales} ${cuposTotales === 1 ? "cupo" : "cupos"}`,
      icon: <IconEquipo className="size-4" />,
    });
  }

  return (
    <aside className="min-w-0">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:gap-5 sm:p-6">
        {/* Desktop: org completa como antes */}
        {org?.nombre && (
          <Link
            href={`/organizaciones/${org.id}`}
            className="group hidden items-start gap-3 lg:flex"
          >
            <OrgLogo logoUrl={org.logo_url} nombre={org.nombre} size="md" />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-semibold leading-snug text-ink group-hover:text-electric">
                {org.nombre}
                {org.verificacion === "verificado" && (
                  <span className="ml-1.5 inline-flex align-middle">
                    <VerifiedInfoBadge tipo={org.tipo} />
                  </span>
                )}
              </span>
              {org.tipo && (
                <span className="text-sm text-muted">
                  {TIPO_LABEL[org.tipo] ?? org.tipo}
                </span>
              )}
            </span>
          </Link>
        )}

        {/* Móvil: no repetir org; solo tipo + estado */}
        <p className="text-sm text-muted lg:hidden">
          {org?.tipo ? `${TIPO_LABEL[org.tipo] ?? org.tipo} · ` : null}
          <span className="font-semibold text-sprout">{abiertoLabel}</span>
        </p>

        {/* Desktop: Abierto como antes */}
        <span className="hidden font-semibold text-sprout lg:inline">
          {abiertoLabel}
        </span>

        <div className="flex flex-col gap-2">
          {tieneRoles && (
            <a
              href="#roles"
              className={cn(buttonClasses({ variant: "primary" }), "w-full")}
            >
              Ver roles disponibles
            </a>
          )}
          {org?.id && (
            <Link
              href={`/organizaciones/${org.id}`}
              className={cn(buttonClasses({ variant: "outline" }), "w-full")}
            >
              Ver organización
            </Link>
          )}
        </div>

        {meta.length > 0 && (
          <dl className="grid grid-cols-2 gap-x-3 gap-y-3 border-t border-border pt-4">
            {meta.map((item) => (
              <div
                key={item.label}
                className="flex min-w-0 items-start gap-2 text-sm"
              >
                <span className="mt-0.5 shrink-0 text-electric" aria-hidden>
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <dt className="text-xs text-muted">{item.label}</dt>
                  <dd className="truncate font-medium text-ink">{item.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        )}
      </div>
    </aside>
  );
}

function IconModalidad({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

function IconCalendario({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function IconReloj({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IconEquipo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="9" cy="8" r="3.25" />
      <path d="M2.5 19c1.1-3.2 3.6-4.8 6.5-4.8s5.4 1.6 6.5 4.8" />
      <path d="M15.5 4.3a3.25 3.25 0 0 1 0 6.4" />
      <path d="M17.5 14.4c2.2.5 3.7 2 4.5 4.6" />
    </svg>
  );
}
