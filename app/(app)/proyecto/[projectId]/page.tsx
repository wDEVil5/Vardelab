import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/features/auth/queries";
import { getMyTeams } from "@/features/teams/queries";
import { getProjectMilestones } from "@/features/milestones/queries";

export const metadata: Metadata = {
  title: "Mi proyecto · CampusLab",
};

type PageProps = { params: Promise<{ projectId: string }> };

// Iniciales para el avatar de cada integrante: primeras letras de hasta dos
// palabras del nombre — mismo criterio que en el resto del sitio.
function iniciales(nombre: string | null): string {
  const partes = (nombre ?? "").trim().split(/\s+/).slice(0, 2);
  return partes.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

// Estado del hito → etiqueta, color del texto del badge y color del círculo.
const HITO: Record<
  string,
  { label: string; badge: string; circulo: string }
> = {
  aprobado: {
    label: "Completado",
    badge: "bg-sprout/15 text-emerald-600",
    circulo: "bg-sprout text-white",
  },
  entregado: {
    label: "En revisión",
    badge: "bg-electric/10 text-electric",
    circulo: "bg-electric text-white",
  },
  en_progreso: {
    label: "En progreso",
    badge: "bg-electric/10 text-electric",
    circulo: "bg-electric text-white",
  },
  pendiente: {
    label: "Pendiente",
    badge: "bg-surface text-muted",
    circulo: "bg-surface text-muted",
  },
};

/**
 * E-05 · Espacio de un proyecto del estudiante: avance general y hitos. El acceso
 * se valida contra sus equipos (si no integra este proyecto → 404). Cada hito
 * lleva a entregar su evidencia (E-06). Requiere sesión.
 */
export default async function ProyectoWorkspacePage({ params }: PageProps) {
  const { projectId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/ingresar?next=/proyecto/${projectId}`);

  const teams = await getMyTeams();
  const misProyectos = teams.filter((t) => t.projectId);
  const equipo = misProyectos.find((t) => t.projectId === projectId);
  if (!equipo) notFound();

  const hitos = await getProjectMilestones(projectId);
  const total = hitos.length;
  const aprobados = hitos.filter((h) => h.estado === "aprobado").length;
  const progreso = total > 0 ? Math.round((aprobados / total) * 100) : 0;
  const accionable = hitos.find((h) => h.estado !== "aprobado") ?? null;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 lg:py-10">
      <header className="flex flex-col gap-2">
        {misProyectos.length > 1 && (
          <Link
            href="/proyecto"
            className="text-sm text-muted transition-colors hover:text-ink"
          >
            ← Mis proyectos
          </Link>
        )}
        <h1 className="text-2xl font-bold text-ink">Mi proyecto</h1>
        <p className="text-sm text-muted">{equipo.projectTitulo} · Activo</p>
      </header>

      {/* Progreso general */}
      <section className="mt-6 rounded-2xl border border-border bg-white p-6">
        <p className="text-sm text-muted">Progreso general</p>
        <div className="mt-2 flex items-center gap-4">
          <span className="text-4xl font-bold tracking-tight text-electric">
            {progreso}%
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-electric transition-[width]"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
        {equipo.projectOrg && (
          <p className="mt-4 text-sm text-muted">{equipo.projectOrg}</p>
        )}
      </section>

      {/* Equipo: antes solo se veía "Equipo de N", sin saber quién ni en qué
          rol — el dato ya lo traía `getMyTeams()`, solo no se mostraba. */}
      <section className="mt-4 rounded-2xl border border-border bg-white p-6">
        <h2 className="text-lg font-semibold text-ink">
          Equipo <span className="font-normal text-muted">({equipo.members.length})</span>
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {equipo.members.map((m) => (
            <li key={m.userId} className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-semibold text-ink">
                {iniciales(m.nombre)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {m.nombre}
                  {m.esYo && <span className="text-muted"> (Tú)</span>}
                </p>
                {m.rol && <p className="text-xs text-muted">{m.rol}</p>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Hitos */}
      <section className="mt-4 rounded-2xl border border-border bg-white p-6">
        <h2 className="text-lg font-semibold text-ink">Hitos</h2>

        {total === 0 ? (
          <p className="mt-3 text-sm text-muted">
            La organización todavía no definió los hitos del proyecto.
          </p>
        ) : (
          <ol className="mt-4 flex flex-col">
            {hitos.map((h, i) => {
              const est = HITO[h.estado] ?? HITO.pendiente;
              const aprobado = h.estado === "aprobado";
              return (
                <li key={h.id}>
                  <Link
                    href={`/proyecto/${projectId}/entregar/${h.id}`}
                    aria-disabled={aprobado}
                    className={cn(
                      "flex items-center gap-4 border-b border-border py-4 transition-colors last:border-0",
                      aprobado
                        ? "pointer-events-none"
                        : "-mx-2 rounded-lg px-2 hover:bg-surface/50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        est.circulo,
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 font-semibold text-ink">
                      {h.titulo}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                        est.badge,
                      )}
                    >
                      {est.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {accionable && (
        <div className="mt-6">
          <Link
            href={`/proyecto/${projectId}/entregar/${accionable.id}`}
            className={buttonClasses({ variant: "primary" })}
          >
            Registrar avance
          </Link>
        </div>
      )}
    </div>
  );
}
