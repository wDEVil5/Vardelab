import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { OrgLogo } from "@/components/ui/org-logo";
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

const VERIFICACION: Record<string, { label: string; tone: BadgeTone }> = {
  verificado: { label: "Verificada", tone: "success" },
  en_revision: { label: "En revisión", tone: "brand" },
  sin_verificar: { label: "Sin verificar", tone: "neutral" },
};

/** Panel del patrocinador: sus organizaciones. Requiere sesión de patrocinador. */
export default async function MisOrganizacionesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?next=/mis-organizaciones");
  if (!user.esPatrocinador) redirect("/proyectos");

  const organizaciones = await getMyOrganizations();

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 lg:py-10">
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
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {organizaciones.map((o) => {
            const verif = VERIFICACION[o.verificacion] ?? {
              label: o.verificacion,
              tone: "neutral" as BadgeTone,
            };
            return (
              <li
                key={o.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6"
              >
                <OrgLogo logoUrl={o.logo_url} nombre={o.nombre} size="lg" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <span className="line-clamp-2 font-semibold text-ink">
                    {o.nombre}
                  </span>
                  <span className="text-sm text-muted">
                    {TIPO_LABEL[o.tipo] ?? o.tipo}
                  </span>
                  <Badge tone={verif.tone} className="w-fit">
                    {verif.label}
                  </Badge>
                </div>
                <Link
                  href={`/mis-organizaciones/${o.id}/editar`}
                  className={cn(
                    buttonClasses({ variant: "outline", size: "sm" }),
                    "w-full",
                  )}
                >
                  Editar perfil
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
