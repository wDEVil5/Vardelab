import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/features/auth/queries";
import {
  getStudentDashboard,
  type HitoResumen,
} from "@/features/dashboard/queries";
import { getPublishedProjects } from "@/features/projects/queries";
import { ProjectCard } from "@/features/projects/components/project-card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Inicio · CampusLab",
};

// Estado de un hito → punto de color y etiqueta.
const ESTADO_HITO: Record<string, { dot: string; label: string }> = {
  pendiente: { dot: "bg-muted", label: "Pendiente" },
  en_progreso: { dot: "bg-coral", label: "En progreso" },
  entregado: { dot: "bg-electric", label: "Entregado" },
  aprobado: { dot: "bg-sprout", label: "Aprobado" },
};

function fecha(f: string | null): string | null {
  if (!f) return null;
  return new Date(`${f}T00:00:00`).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
  });
}

/**
 * E-00 · Inicio del estudiante. Panel de actividad a ancho completo: KPIs, el
 * proyecto activo con su línea de hitos, el estado de las postulaciones, qué
 * falta para completar el perfil y recomendaciones del catálogo.
 */
export default async function InicioPage() {
  const user = await getCurrentUser();
  const nombre = (user?.nombre ?? "").split(/\s+/)[0] || "";

  const [dashboard, recomendados] = await Promise.all([
    getStudentDashboard(),
    getPublishedProjects().then((p) => p.slice(0, 3)),
  ]);

  const activo = dashboard?.proyectoActivo ?? null;
  const post = dashboard?.postulaciones ?? {
    total: 0,
    aceptadas: 0,
    enRevision: 0,
    rechazadas: 0,
  };
  const perfil = dashboard?.perfil ?? { pct: 0, faltan: [] as string[] };

  return (
    <div className="w-full px-6 py-8 lg:px-10 lg:py-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Hola, {nombre} <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1 text-muted">Tu resumen de actividad y próximos pasos.</p>
      </header>

      {/* KPIs */}
      <div className="mt-8 grid gap-4 grid-cols-2 xl:grid-cols-4">
        <StatCard label="Perfil completado" value={`${perfil.pct}%`} tone="electric" />
        <StatCard label="Postulaciones" value={String(post.total)} tone="sprout" />
        <StatCard
          label="Acciones pendientes"
          value={String(dashboard?.accionesPendientes ?? 0)}
          tone="coral"
        />
        <StatCard
          label="Evidencias"
          value={String(dashboard?.portafolioCount ?? 0)}
          tone="ink"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Proyecto activo (columna ancha) */}
        <div className="lg:col-span-2">
          {activo ? (
            <div className="flex h-full flex-col gap-5 rounded-2xl bg-ink p-6 text-white sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-electric">
                    Proyecto activo
                  </span>
                  <h2 className="mt-1 text-2xl font-bold">{activo.titulo}</h2>
                  <p className="mt-1 text-sm text-white/70">
                    Hito {activo.hitosAprobados} de {activo.hitosTotal} · Equipo de{" "}
                    {activo.equipoTamano}
                  </p>
                </div>
                <Link
                  href={`/proyectos/${activo.id}`}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
                >
                  Ver proyecto →
                </Link>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Progreso</span>
                  <span className="font-semibold">{activo.progreso}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-electric"
                    style={{ width: `${activo.progreso}%` }}
                  />
                </div>
              </div>

              {/* Línea de hitos */}
              {activo.hitos.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {activo.hitos.map((h: HitoResumen) => {
                    const meta = ESTADO_HITO[h.estado ?? ""] ?? {
                      dot: "bg-white/40",
                      label: h.estado ?? "",
                    };
                    const f = fecha(h.fechaLimite);
                    return (
                      <li
                        key={h.id}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5"
                      >
                        <span className={cn("size-2.5 shrink-0 rounded-full", meta.dot)} />
                        <span className="flex-1 truncate text-sm">{h.titulo}</span>
                        {f && <span className="text-xs text-white/50">{f}</span>}
                        <span className="text-xs text-white/60">{meta.label}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col items-start gap-3 rounded-2xl border border-dashed border-border bg-white p-6 sm:p-8">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Proyecto activo
              </span>
              <p className="font-medium text-ink">Todavía no estás en un proyecto.</p>
              <p className="text-sm text-muted">
                Postula a un rol y, cuando te seleccionen, tu proyecto aparecerá
                aquí con su avance y sus hitos.
              </p>
              <Link
                href="/proyectos"
                className="text-sm font-medium text-electric hover:underline"
              >
                Explorar proyectos →
              </Link>
            </div>
          )}
        </div>

        {/* Columna lateral: completar perfil + postulaciones */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink">Completa tu perfil</h2>
              <span className="text-sm font-semibold text-electric">{perfil.pct}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-electric"
                style={{ width: `${perfil.pct}%` }}
              />
            </div>
            {perfil.faltan.length > 0 ? (
              <>
                <ul className="mt-4 flex flex-col gap-2">
                  {perfil.faltan.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted">
                      <span className="size-1.5 rounded-full bg-coral" />
                      Falta: {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/perfil"
                  className="mt-4 inline-block text-sm font-medium text-electric hover:underline"
                >
                  Completar perfil →
                </Link>
              </>
            ) : (
              <p className="mt-4 text-sm text-sprout">Tu perfil está completo. ✓</p>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-6">
            <h2 className="font-semibold text-ink">Postulaciones</h2>
            {post.total > 0 ? (
              <div className="flex flex-wrap gap-2">
                {post.aceptadas > 0 && (
                  <Pill tone="sprout">{post.aceptadas} aceptada{post.aceptadas === 1 ? "" : "s"}</Pill>
                )}
                {post.enRevision > 0 && (
                  <Pill tone="electric">{post.enRevision} en revisión</Pill>
                )}
                {post.rechazadas > 0 && (
                  <Pill tone="muted">{post.rechazadas} rechazada{post.rechazadas === 1 ? "" : "s"}</Pill>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">
                Aún no te postulaste. Explora y encuentra un rol.
              </p>
            )}
            <Link
              href="/mis-postulaciones"
              className="mt-auto text-sm font-medium text-electric hover:underline"
            >
              Ver todas →
            </Link>
          </div>
        </div>
      </div>

      {/* Recomendados */}
      {recomendados.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-ink">Recomendados para ti</h2>
            <Link
              href="/proyectos"
              className="text-sm font-medium text-electric hover:underline"
            >
              Ver todos →
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recomendados.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Tarjeta de KPI.
function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "electric" | "sprout" | "coral" | "ink";
}) {
  const color = {
    electric: "text-electric",
    sprout: "text-sprout",
    coral: "text-coral",
    ink: "text-ink",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={cn("mt-2 text-3xl font-bold", color)}>{value}</p>
    </div>
  );
}

// Pastilla de conteo por estado.
function Pill({
  tone,
  children,
}: {
  tone: "sprout" | "electric" | "muted";
  children: React.ReactNode;
}) {
  const cls = {
    sprout: "bg-sprout/15 text-ink",
    electric: "bg-electric/10 text-electric",
    muted: "bg-surface text-muted",
  }[tone];
  return (
    <span className={cn("rounded-full px-3 py-1 text-sm font-medium", cls)}>
      {children}
    </span>
  );
}
