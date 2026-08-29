import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/features/auth/queries";
import { getMyProjects } from "@/features/projects/queries";

export const metadata: Metadata = {
  title: "Mis proyectos · CampusLab",
};

// Estado del proyecto → etiqueta y tono.
const ESTADO: Record<string, { label: string; tone: BadgeTone }> = {
  borrador: { label: "Borrador", tone: "neutral" },
  en_revision: { label: "En revisión", tone: "brand" },
  publicado: { label: "Publicado", tone: "success" },
  seleccion: { label: "En selección", tone: "brand" },
  activo: { label: "Activo", tone: "success" },
  revision_final: { label: "Revisión final", tone: "brand" },
  completado: { label: "Completado", tone: "success" },
  suspendido: { label: "Suspendido", tone: "danger" },
  cancelado: { label: "Cancelado", tone: "danger" },
};

/** Panel del patrocinador: sus proyectos. Requiere sesión de patrocinador. */
export default async function MisProyectosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?next=/mis-proyectos");
  if (!user.esPatrocinador) redirect("/proyectos");

  const proyectos = await getMyProjects();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-ink">Mis proyectos</h1>
          <p className="text-sm text-muted">
            Los proyectos que publicas para tu organización.
          </p>
        </div>
        <Link
          href="/mis-proyectos/nuevo"
          className={buttonClasses({ variant: "primary", size: "sm" })}
        >
          Nuevo proyecto
        </Link>
      </header>

      {proyectos.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <p className="font-medium text-ink">Todavía no tienes proyectos</p>
          <p className="mt-1 text-sm text-muted">
            Crea tu primer proyecto: se guarda como borrador hasta que lo
            publiques.
          </p>
          <Link
            href="/mis-proyectos/nuevo"
            className={cn(
              "mt-4 inline-flex",
              buttonClasses({ variant: "primary", size: "sm" }),
            )}
          >
            Crear proyecto
          </Link>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {proyectos.map((p) => {
            const estado = ESTADO[p.status] ?? {
              label: p.status,
              tone: "neutral" as BadgeTone,
            };
            const numRoles = p.roles?.length ?? 0;
            return (
              <li
                key={p.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-border bg-white p-5"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-ink">{p.titulo}</span>
                  <span className="text-sm text-muted">
                    {p.organization?.nombre} · {numRoles}{" "}
                    {numRoles === 1 ? "rol" : "roles"}
                  </span>
                </div>
                <Badge tone={estado.tone}>{estado.label}</Badge>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
