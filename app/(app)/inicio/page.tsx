import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/features/auth/queries";
import { getStudentDashboard } from "@/features/dashboard/queries";
import { getPublishedProjects } from "@/features/projects/queries";
import { ProjectCard } from "@/features/projects/components/project-card";
import { PatrocinadorInicio } from "@/features/dashboard/components/patrocinador-inicio";
import { ModeradorInicio } from "@/features/dashboard/components/moderador-inicio";
import { buttonClasses } from "@/components/ui/button";
import { ProgressGauge } from "@/components/progress-gauge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Inicio · CampusLab",
};

function diasRestantes(f: string | null): number | null {
  if (!f) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const d = new Date(`${f}T00:00:00`);
  return Math.round((d.getTime() - hoy.getTime()) / 86_400_000);
}

function vencimiento(n: number | null): string | null {
  if (n === null) return null;
  if (n < 0) return "vencido";
  if (n === 0) return "vence hoy";
  if (n === 1) return "vence mañana";
  return `vence en ${n} días`;
}

/**
 * E-00 · Inicio del estudiante, como panel (dashboard). Jerarquía: una fila de
 * KPI arriba (perfil, postulaciones, pendientes, evidencias), y debajo dos
 * paneles —el medidor de progreso del proyecto y sus próximas entregas—. Los
 * KPI llevan contexto real (no tendencias: no hay histórico con qué comparar).
 * Sin proyecto activo, los paneles ceden lugar a una invitación a explorar.
 */
export default async function InicioPage() {
  const user = await getCurrentUser();
  const nombre = (user?.nombre ?? "").split(/\s+/)[0] || "";

  if (user?.esModerador || user?.esAdmin) {
    return <ModeradorInicio nombre={nombre} />;
  }

  if (user?.esPatrocinador && !user?.esEstudiante) {
    return <PatrocinadorInicio nombre={nombre} />;
  }

  const dashboard = await getStudentDashboard();
  const activo = dashboard?.proyectoActivo ?? null;
  const perfil = dashboard?.perfil ?? { pct: 0, faltan: [] as string[] };
  const post = dashboard?.postulaciones ?? {
    total: 0,
    aceptadas: 0,
    enRevision: 0,
    rechazadas: 0,
  };
  const pendientes = dashboard?.accionesPendientes ?? 0;
  const evidencias = dashboard?.portafolioCount ?? 0;

  // Entregas abiertas del proyecto activo, de la más urgente a la menos.
  const entregas = (activo?.hitos ?? [])
    .filter((h) => h.estado !== "aprobado")
    .map((h) => ({ ...h, dias: diasRestantes(h.fechaLimite) }))
    .sort((a, b) => (a.dias ?? Infinity) - (b.dias ?? Infinity));

  // Recomendados solo cuando no hay proyecto activo (para no cargar de más).
  const recomendados = activo
    ? []
    : (await getPublishedProjects()).slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:py-10">
      {/* Encabezado */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Hola, {nombre}.
        </h1>
        {activo && (
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-sm text-muted">
            <span className="size-2 rounded-full bg-sprout" aria-hidden />
            Proyecto en curso
          </span>
        )}
      </header>

      {/* Fila de KPI */}
      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          href="/perfil"
          icon="perfil"
          valor={`${perfil.pct}%`}
          label="Perfil"
          sub={
            perfil.pct < 100
              ? `faltan ${perfil.faltan.length} ${perfil.faltan.length === 1 ? "campo" : "campos"}`
              : "completo"
          }
          alerta={perfil.pct < 100}
        />
        <KpiCard
          href="/mis-postulaciones"
          icon="postulacion"
          valor={post.total}
          label="Postulaciones"
          sub={
            post.enRevision > 0
              ? `${post.enRevision} en revisión`
              : "ninguna en revisión"
          }
        />
        <KpiCard
          href={activo ? `/proyecto/${activo.id}` : "/proyectos"}
          icon="pendiente"
          valor={pendientes}
          label="Pendientes"
          sub={pendientes > 0 ? "entregas por hacer" : "al día"}
          alerta={pendientes > 0}
        />
        <KpiCard
          href="/perfil"
          icon="evidencia"
          valor={evidencias}
          label="Evidencias"
          sub={evidencias > 0 ? "en tu portafolio" : "suma tu primera"}
        />
      </section>

      {/* Paneles */}
      {activo ? (
        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* Medidor de progreso */}
          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                Progreso del proyecto
              </span>
            </div>
            <Link
              href={`/proyecto/${activo.id}`}
              className="mt-1 block truncate font-semibold text-ink transition-colors hover:text-electric"
            >
              {activo.titulo}
            </Link>

            <div className="mt-4 flex flex-col items-center">
              <ProgressGauge pct={activo.progreso} />
              <p className="mt-3 text-sm text-muted">
                <span className="font-medium text-ink">
                  {activo.hitosAprobados} de {activo.hitosTotal}
                </span>{" "}
                hitos aprobados
                {activo.equipoTamano > 0 &&
                  ` · equipo de ${activo.equipoTamano}`}
              </p>
            </div>
          </div>

          {/* Próximas entregas */}
          <div className="flex flex-col rounded-2xl border border-border bg-white p-6">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Próximas entregas
            </span>

            {entregas.length > 0 ? (
              <ul className="mt-3 flex-1">
                {entregas.slice(0, 5).map((h) => {
                  const venc = vencimiento(h.dias);
                  const urgente = h.dias !== null && h.dias <= 2;
                  const enCurso = h.estado === "en_progreso";
                  return (
                    <li key={h.id}>
                      <Link
                        href={`/proyecto/${activo.id}`}
                        className="flex items-center gap-3 border-b border-border py-2.5 text-sm transition-colors last:border-0 hover:text-electric"
                      >
                        <span
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            enCurso ? "bg-electric" : "bg-border",
                          )}
                          aria-hidden
                        />
                        <span className="flex-1 truncate text-ink">
                          {h.titulo}
                        </span>
                        {venc && (
                          <span
                            className={cn(
                              "shrink-0 text-xs",
                              urgente ? "text-coral" : "text-muted",
                            )}
                          >
                            {venc}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 flex-1 text-sm text-muted">
                Sin entregas pendientes por ahora. Buen trabajo.
              </p>
            )}

            <Link
              href={`/proyecto/${activo.id}`}
              className="mt-4 inline-flex text-sm font-medium text-electric hover:underline"
            >
              Ir al proyecto →
            </Link>
          </div>
        </section>
      ) : (
        <section className="mt-4 rounded-2xl border border-dashed border-border bg-white p-8">
          <p className="font-medium text-ink">Todavía no estás en un proyecto.</p>
          <p className="mt-1 text-sm text-muted">
            Explora los desafíos abiertos y postula a un rol que encaje con lo que
            sabes hacer.
          </p>
          <Link
            href="/proyectos"
            className={cn(
              "mt-5 inline-flex",
              buttonClasses({ variant: "primary", size: "sm" }),
            )}
          >
            Explorar proyectos
          </Link>
        </section>
      )}

      {/* Recomendados (solo sin proyecto activo) */}
      {!activo && recomendados.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Para ti
          </h2>
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

/* — Piezas presentacionales (sin estado; render en el servidor) — */

type IconName = "perfil" | "postulacion" | "pendiente" | "evidencia";

// Íconos mínimos en línea (trazo), para no cargar una librería.
function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    perfil: "M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0",
    postulacion: "M4 4h16v16H4zM4 9h16M9 4v16",
    pendiente: "M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z",
    evidencia: "M4 7h6l2 2h8v9a2 2 0 01-2 2H4z",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={paths[name]} />
    </svg>
  );
}

function KpiCard({
  href,
  icon,
  valor,
  label,
  sub,
  alerta = false,
}: {
  href: string;
  icon: IconName;
  valor: string | number;
  label: string;
  sub: string;
  alerta?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border bg-white p-5 transition-colors hover:border-electric/40"
    >
      <span
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-full",
          alerta
            ? "bg-electric/10 text-electric"
            : "bg-surface text-muted",
        )}
      >
        <Icon name={icon} />
      </span>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">
        {valor}
      </p>
      <p className="text-sm font-medium text-ink">{label}</p>
      <p className={cn("text-xs", alerta ? "text-electric" : "text-muted")}>
        {sub}
      </p>
    </Link>
  );
}

