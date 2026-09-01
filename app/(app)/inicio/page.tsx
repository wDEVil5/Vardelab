import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/features/auth/queries";
import { getStudentDashboard } from "@/features/dashboard/queries";
import { getPublishedProjects } from "@/features/projects/queries";
import { ProjectCard } from "@/features/projects/components/project-card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Inicio · CampusLab",
};

/**
 * E-00 · Inicio del estudiante. Resumen de actividad y próximos pasos dentro del
 * shell autenticado, con datos reales: completitud del perfil, postulaciones,
 * proyecto activo (progreso por hitos) y recomendados del catálogo.
 */
export default async function InicioPage() {
  const user = await getCurrentUser();
  const nombre = (user?.nombre ?? "").split(/\s+/)[0] || "";

  const [dashboard, recomendados] = await Promise.all([
    getStudentDashboard(),
    getPublishedProjects().then((p) => p.slice(0, 3)),
  ]);

  const activo = dashboard?.proyectoActivo ?? null;
  const post = dashboard?.postulaciones ?? { total: 0, aceptadas: 0, enRevision: 0 };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:py-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Hola, {nombre} <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1 text-muted">Tu resumen de actividad y próximos pasos.</p>
      </header>

      {/* Métricas */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Perfil completado"
          value={`${dashboard?.perfilCompleto ?? 0}%`}
          tone="electric"
        />
        <StatCard label="Postulaciones" value={String(post.total)} tone="sprout" />
        <StatCard
          label="Acciones pendientes"
          value={String(dashboard?.accionesPendientes ?? 0)}
          tone="coral"
        />
      </div>

      {/* Proyecto activo + resumen de postulaciones */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {activo ? (
          <div className="flex flex-col gap-4 rounded-2xl bg-ink p-6 text-white sm:p-8 lg:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-electric">
              Proyecto activo
            </span>
            <div>
              <h2 className="text-2xl font-bold">{activo.titulo}</h2>
              <p className="mt-1 text-sm text-white/70">
                Hito {activo.hitosAprobados} de {activo.hitosTotal} · Equipo de{" "}
                {activo.equipoTamano}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Progreso</span>
                <span className="font-semibold">{activo.progreso}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-electric transition-[width]"
                  style={{ width: `${activo.progreso}%` }}
                />
              </div>
            </div>
            {activo.proximoHito ? (
              <p className="text-sm text-white/70">
                Próximo hito ·{" "}
                <span className="text-white">{activo.proximoHito}</span>
              </p>
            ) : (
              <p className="text-sm text-white/70">Todos los hitos al día.</p>
            )}
            <Link
              href={`/proyectos/${activo.id}`}
              className="mt-1 w-fit text-sm font-medium text-electric hover:underline"
            >
              Ver proyecto →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border bg-white p-6 sm:p-8 lg:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Proyecto activo
            </span>
            <p className="font-medium text-ink">Todavía no estás en un proyecto.</p>
            <p className="text-sm text-muted">
              Postula a un rol y, cuando te seleccionen, tu proyecto aparecerá aquí
              con su avance.
            </p>
            <Link
              href="/proyectos"
              className="text-sm font-medium text-electric hover:underline"
            >
              Explorar proyectos →
            </Link>
          </div>
        )}

        <aside className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-6">
          <h2 className="font-semibold text-ink">Postulaciones</h2>
          {post.total > 0 ? (
            <div className="flex flex-col gap-2">
              {post.aceptadas > 0 && (
                <span className="w-fit rounded-full bg-sprout/15 px-3 py-1 text-sm font-medium text-ink">
                  {post.aceptadas} aceptada{post.aceptadas === 1 ? "" : "s"}
                </span>
              )}
              {post.enRevision > 0 && (
                <span className="w-fit rounded-full bg-electric/10 px-3 py-1 text-sm font-medium text-electric">
                  {post.enRevision} en revisión
                </span>
              )}
              <p className="text-sm text-muted">
                {post.total} postulación{post.total === 1 ? "" : "es"} en total.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted">
              Aún no te has postulado. Explora los proyectos y encuentra un rol.
            </p>
          )}
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
