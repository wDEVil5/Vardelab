import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/features/auth/queries";
import { getMyApplications } from "@/features/applications/queries";
import { withdrawApplication } from "@/features/applications/actions";

export const metadata: Metadata = {
  title: "Mis postulaciones · CampusLab",
};

// Estado de la postulación → etiqueta y tono del badge.
const ESTADO: Record<string, { label: string; tone: BadgeTone }> = {
  enviada: { label: "Enviada", tone: "brand" },
  aceptada: { label: "Aceptada", tone: "success" },
  rechazada: { label: "Rechazada", tone: "danger" },
  retirada: { label: "Retirada", tone: "neutral" },
};

/** S-04 · Panel del estudiante: sus postulaciones. Requiere sesión. */
export default async function MisPostulacionesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?next=/mis-postulaciones");

  const postulaciones = await getMyApplications();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Mis postulaciones</h1>
        <p className="text-sm text-muted">
          El estado de los roles a los que postulaste.
        </p>
      </header>

      {postulaciones.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <p className="font-medium text-ink">Todavía no postulaste a nada</p>
          <p className="mt-1 text-sm text-muted">
            Explora el catálogo y postula al rol que se ajuste a lo que sabes
            hacer.
          </p>
          <Link
            href="/proyectos"
            className={cn(
              "mt-4 inline-flex",
              buttonClasses({ variant: "primary", size: "sm" }),
            )}
          >
            Ver proyectos
          </Link>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {postulaciones.map((p) => {
            const estado = ESTADO[p.status] ?? {
              label: p.status,
              tone: "neutral" as BadgeTone,
            };
            const proyecto = p.role?.project;
            return (
              <li
                key={p.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-border bg-white p-5"
              >
                <div className="flex flex-col gap-1">
                  <Link
                    href={`/proyectos/${proyecto?.id}`}
                    className="font-semibold text-ink hover:text-electric"
                  >
                    {proyecto?.titulo}
                  </Link>
                  <span className="text-sm text-muted">
                    Rol: {p.role?.nombre}
                    {proyecto?.organization?.nombre &&
                      ` · ${proyecto.organization.nombre}`}
                  </span>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Badge tone={estado.tone}>{estado.label}</Badge>
                  {/* Retirar solo tiene sentido mientras está enviada. */}
                  {p.status === "enviada" && (
                    <form action={withdrawApplication}>
                      <input type="hidden" name="applicationId" value={p.id} />
                      <button
                        type="submit"
                        className={buttonClasses({
                          variant: "ghost",
                          size: "sm",
                        })}
                      >
                        Retirar
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
