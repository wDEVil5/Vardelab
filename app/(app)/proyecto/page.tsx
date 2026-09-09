import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/features/auth/queries";
import { getMyTeams } from "@/features/teams/queries";
import { getProjectMilestones } from "@/features/milestones/queries";

export const metadata: Metadata = {
  title: "Mis proyectos · CampusLab",
};

// Conectores que no aportan a las iniciales del monograma.
const CONECTORES = new Set([
  "de", "del", "la", "el", "los", "las", "y", "en", "para", "por", "un", "una",
]);

function monograma(titulo: string): string {
  const palabras = titulo
    .trim()
    .split(/\s+/)
    .filter((w) => w && !CONECTORES.has(w.toLowerCase()));
  const base = palabras.length > 0 ? palabras : [titulo];
  return base.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "·";
}

/**
 * E-05 (índice) · Los proyectos en curso del estudiante. Con uno solo, entra
 * directo a su espacio; con varios, los muestra como tarjetas; con ninguno,
 * invita a explorar. Requiere sesión.
 */
export default async function ProyectosIndexPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?next=/proyecto");

  const teams = await getMyTeams();
  const misProyectos = teams.filter((t) => t.projectId);

  // Sin proyecto: estado vacío.
  if (misProyectos.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-8 lg:py-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-ink">Mis proyectos</h1>
          <p className="text-sm text-muted">Tu espacio de trabajo.</p>
        </header>
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
          <p className="font-medium text-ink">Todavía no estás en un proyecto</p>
          <p className="mt-1 text-sm text-muted">
            Cuando una organización te seleccione, aquí verás tu avance y los hitos
            por entregar.
          </p>
          <Link
            href="/proyectos"
            className={cn(
              "mt-4 inline-flex",
              buttonClasses({ variant: "primary", size: "sm" }),
            )}
          >
            Explorar proyectos
          </Link>
        </div>
      </div>
    );
  }

  // Un solo proyecto: entra directo a su espacio (sin paso intermedio).
  if (misProyectos.length === 1) {
    redirect(`/proyecto/${misProyectos[0].projectId}`);
  }

  // Varios: progreso de cada uno para la tarjeta.
  const tarjetas = await Promise.all(
    misProyectos.map(async (t) => {
      const hitos = await getProjectMilestones(t.projectId!);
      const total = hitos.length;
      const aprobados = hitos.filter((h) => h.estado === "aprobado").length;
      return {
        projectId: t.projectId!,
        titulo: t.projectTitulo,
        org: t.projectOrg,
        equipo: t.members.length,
        total,
        aprobados,
        progreso: total > 0 ? Math.round((aprobados / total) * 100) : 0,
      };
    }),
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 lg:py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Mis proyectos</h1>
        <p className="text-sm text-muted">
          Los proyectos donde te seleccionaron. Entrá a uno para ver sus hitos.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {tarjetas.map((p) => (
          <Link
            key={p.projectId}
            href={`/proyecto/${p.projectId}`}
            className="group flex flex-col rounded-2xl border border-border bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-electric/40 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-electric/10 text-base font-semibold text-electric">
                {monograma(p.titulo)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink group-hover:text-electric">
                  {p.titulo}
                </p>
                {p.org && <p className="truncate text-xs text-muted">{p.org}</p>}
              </div>
            </div>

            {/* Progreso */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Progreso</span>
                <span className="font-medium text-ink">{p.progreso}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-electric"
                  style={{ width: `${p.progreso}%` }}
                />
              </div>
            </div>

            <p className="mt-4 text-xs text-muted">
              {p.aprobados} de {p.total} hitos · Equipo de {p.equipo}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
