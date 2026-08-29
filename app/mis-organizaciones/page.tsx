import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
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
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
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
        <div className="mt-8 rounded-lg border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
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
        <ul className="mt-8 flex flex-col gap-3">
          {organizaciones.map((o) => {
            const verif = VERIFICACION[o.verificacion] ?? {
              label: o.verificacion,
              tone: "neutral" as BadgeTone,
            };
            return (
              <li
                key={o.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-border bg-white p-5"
              >
                <div className="flex flex-col gap-1">
                  <Link
                    href={`/mis-organizaciones/${o.id}/editar`}
                    className="font-semibold text-ink hover:text-electric"
                  >
                    {o.nombre}
                  </Link>
                  <span className="text-sm text-muted">
                    {TIPO_LABEL[o.tipo] ?? o.tipo}
                  </span>
                </div>
                <Badge tone={verif.tone}>{verif.label}</Badge>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
