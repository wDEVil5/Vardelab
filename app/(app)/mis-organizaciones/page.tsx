import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { OrgLogo } from "@/components/ui/org-logo";
import { VerifiedBadge, PendingVerificationBadge } from "@/components/ui/verified-badge";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/features/auth/queries";
import { getMyOrganizations } from "@/features/organizations/queries";

export const metadata: Metadata = {
  title: "Mis organizaciones · CampusLab",
};

const TIPO_LABEL: Record<string, string> = {
  academica: "Académica",
  social: "Social",
  emprendimiento: "Emprendimiento",
  empresa: "Empresa",
  interna: "Interna",
};

/** Panel del patrocinador: sus organizaciones. Requiere sesión de patrocinador. */
export default async function MisOrganizacionesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?next=/mis-organizaciones");
  if (!user.esPatrocinador) redirect("/proyectos");

  const organizaciones = await getMyOrganizations();

  const verificadas = organizaciones.filter((o) => o.verificacion === "verificado").length;
  const enRevision = organizaciones.filter((o) => o.verificacion === "en_revision").length;
  const sinVerificar = organizaciones.filter((o) => o.verificacion === "sin_verificar").length;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:py-10">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-ink">Mis organizaciones</h1>
          <p className="text-sm text-muted">
            Bajo estas organizaciones publicas tus proyectos.
          </p>
        </div>
        <Link
          href="/mis-organizaciones/nueva"
          className={buttonClasses({ variant: "primary", size: "sm" })}
        >
          Nueva organización
        </Link>
      </header>

      {organizaciones.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <p className="font-medium text-ink">Todavía no tienes organizaciones</p>
          <p className="mt-1 text-sm text-muted">
            Crea una para poder publicar proyectos bajo su nombre.
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
        <>
          {/* Franja de resumen, no tarjetas: a propósito con otro lenguaje
              visual que las organizaciones de abajo (fondo tinturado, sin
              blanco ni sombra) para que no se lean como "más tarjetas" —
              mismo patrón que ya usan los perfiles públicos (`/u/[id]`,
              `/organizaciones/[id]`). Con una sola organización sigue
              aportando (confirma su estado de un vistazo) en vez de ser puro
              relleno. */}
          <div className="mt-8 flex divide-x divide-border rounded-xl border border-border bg-surface/50">
            <KpiCell valor={verificadas} label="Verificadas" icon={IconCheck} />
            <KpiCell valor={enRevision} label="En revisión" icon={IconReloj} />
            <KpiCell valor={sinVerificar} label="Sin verificar" icon={IconEdificio} />
          </div>

          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {organizaciones.map((o) => (
              <li
                key={o.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 transition-all hover:border-electric/30 hover:shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <OrgLogo logoUrl={o.logo_url} nombre={o.nombre} size="md" />
                  <div className="min-w-0 flex-1">
                    {/* El sello va fuera del <p> que trunca: `truncate` es
                        `overflow:hidden`, y si el badge quedara adentro, su
                        tooltip absoluto se recortaba contra ese mismo borde
                        en vez de flotar por encima. */}
                    <div className="flex items-center gap-1.5">
                      <p className="min-w-0 truncate text-lg font-bold text-ink">
                        {o.nombre}
                      </p>
                      {o.verificacion === "verificado" ? (
                        <VerifiedBadge />
                      ) : (
                        <PendingVerificationBadge estado={o.verificacion} />
                      )}
                    </div>
                    <p className="text-sm text-muted">{TIPO_LABEL[o.tipo] ?? o.tipo}</p>
                  </div>
                </div>
                <Link
                  href={`/mis-organizaciones/${o.id}/editar`}
                  className={cn(buttonClasses({ variant: "outline", size: "sm" }), "w-full")}
                >
                  Editar perfil
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// Una celda de la franja de resumen — ícono + número + etiqueta en línea,
// sin borde ni fondo propio (los pone el contenedor con `divide-x`).
function KpiCell({
  valor,
  label,
  icon: Icon,
}: {
  valor: number;
  label: string;
  icon: (props: { className?: string }) => React.JSX.Element;
}) {
  return (
    <div className="flex flex-1 items-center gap-3 px-5 py-4">
      <Icon className="size-4 shrink-0 text-muted" />
      <p className="text-sm text-muted">
        <span className="font-semibold text-ink">{valor}</span> {label}
      </p>
    </div>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
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

function IconEdificio({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16" />
      <path d="M12 21V9a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v12" />
      <path d="M2 21h20" />
      <path d="M7 8h.01M7 12h.01M7 16h.01" />
    </svg>
  );
}
