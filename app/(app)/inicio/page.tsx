import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/features/auth/queries";
import { getPublishedProjects } from "@/features/projects/queries";
import { ProjectCard } from "@/features/projects/components/project-card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Inicio · CampusLab",
};

/**
 * E-00 · Inicio del estudiante. Resumen de actividad y próximos pasos dentro del
 * shell autenticado. Estructura primero: las métricas y el proyecto activo son
 * un placeholder (se conectan a datos reales en el siguiente paso); los
 * recomendados ya usan proyectos publicados reales.
 */
export default async function InicioPage() {
  const user = await getCurrentUser();
  const nombre = (user?.nombre ?? "").split(/\s+/)[0] || "";
  const recomendados = (await getPublishedProjects()).slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:py-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Hola, {nombre} <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1 text-muted">Tu resumen de actividad y próximos pasos.</p>
      </header>

      {/* Métricas (placeholder · pendiente de conectar a datos reales). */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Perfil completado" value="60%" tone="electric" />
        <StatCard label="Postulaciones" value="2" tone="sprout" />
        <StatCard label="Acciones pendientes" value="1" tone="coral" />
      </div>

      {/* Proyecto activo + resumen de postulaciones (placeholder). */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 rounded-2xl bg-ink p-6 text-white sm:p-8 lg:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-electric">
            Proyecto activo
          </span>
          <div>
            <h2 className="text-2xl font-bold">Dashboard de encuesta académica</h2>
            <p className="mt-1 text-sm text-white/70">Semana 2 de 4 · Equipo de 3</p>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70">Progreso</span>
              <span className="font-semibold">60%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-electric" style={{ width: "60%" }} />
            </div>
          </div>
          <p className="text-sm text-white/70">
            Próximo hito · <span className="text-white">Construir dashboard</span>
          </p>
        </div>

        <aside className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-6">
          <h2 className="font-semibold text-ink">Postulaciones</h2>
          <div className="flex flex-col gap-2">
            <span className="w-fit rounded-full bg-sprout/15 px-3 py-1 text-sm font-medium text-ink">
              1 aceptada
            </span>
            <span className="w-fit rounded-full bg-electric/10 px-3 py-1 text-sm font-medium text-electric">
              1 en revisión
            </span>
          </div>
          <Link
            href="/mis-postulaciones"
            className="mt-auto text-sm font-medium text-electric hover:underline"
          >
            Ver todas →
          </Link>
        </aside>
      </div>

      {/* Recomendados (datos reales del catálogo). */}
      {recomendados.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-ink">Recomendados para ti</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recomendados.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Tarjeta de métrica del encabezado.
function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "electric" | "sprout" | "coral";
}) {
  const color = {
    electric: "text-electric",
    sprout: "text-sprout",
    coral: "text-coral",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={cn("mt-2 text-3xl font-bold", color)}>{value}</p>
    </div>
  );
}
