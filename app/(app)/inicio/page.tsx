import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/features/auth/queries";
import {
  getStudentDashboard,
  type HitoResumen,
} from "@/features/dashboard/queries";
import { getPublishedProjects } from "@/features/projects/queries";
import { getMyTeams } from "@/features/teams/queries";
import { getMyEvaluationsByProject } from "@/features/evaluations/queries";
import { getMyProfileSkills, getMyProfile } from "@/features/profile/queries";
import { getMyPortfolioItems } from "@/features/portfolio/queries";
import { ProjectCard } from "@/features/projects/components/project-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Inicio · CampusLab",
};

const ESTADO_HITO: Record<string, { dot: string; label: string }> = {
  pendiente: { dot: "bg-white/40", label: "Pendiente" },
  en_progreso: { dot: "bg-coral", label: "En progreso" },
  entregado: { dot: "bg-electric", label: "Entregado" },
  aprobado: { dot: "bg-sprout", label: "Aprobado" },
};

const NIVEL_LABEL: Record<string, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

function fechaCorta(f: string | null): string | null {
  if (!f) return null;
  return new Date(`${f}T00:00:00`).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
  });
}

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
  return `en ${n} días`;
}

/**
 * E-00 · Inicio del estudiante. Panel de actividad a ancho completo: KPIs, el
 * proyecto activo (hitos + equipo), acciones pendientes con vencimiento, y una
 * fila de widgets compactos (postulaciones, evaluaciones, portafolio,
 * habilidades) más recomendados. Datos reales bajo RLS.
 */
export default async function InicioPage() {
  const user = await getCurrentUser();
  const nombre = (user?.nombre ?? "").split(/\s+/)[0] || "";

  const [dashboard, recomendados, teams, evalsMap, skills, portfolio, profile] =
    await Promise.all([
      getStudentDashboard(),
      getPublishedProjects().then((p) => p.slice(0, 3)),
      getMyTeams(),
      getMyEvaluationsByProject(),
      getMyProfileSkills(),
      getMyPortfolioItems(),
      getMyProfile(),
    ]);

  const activo = dashboard?.proyectoActivo ?? null;
  const post = dashboard?.postulaciones ?? {
    total: 0,
    aceptadas: 0,
    enRevision: 0,
    rechazadas: 0,
  };
  const perfil = dashboard?.perfil ?? { pct: 0, faltan: [] as string[] };

  const equipoActivo = activo
    ? teams.find((t) => t.projectId === activo.id)?.members ?? []
    : [];

  const tituloPorProyecto = new Map(
    teams.filter((t) => t.projectId).map((t) => [t.projectId!, t.projectTitulo]),
  );
  const evaluaciones = Array.from(evalsMap.entries())
    .filter(([, e]) => e.puntaje != null)
    .map(([projectId, e]) => ({
      projectId,
      titulo: tituloPorProyecto.get(projectId) ?? "Proyecto",
      puntaje: e.puntaje,
      comentario: e.comentario,
    }));

  const acciones = (activo?.hitos ?? [])
    .filter((h) => h.estado === "pendiente" || h.estado === "en_progreso")
    .map((h) => ({ ...h, dias: diasRestantes(h.fechaLimite) }));

  return (
    <div className="w-full px-6 py-8 lg:px-10 lg:py-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Hola, {nombre} <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1 text-muted">Tu resumen de actividad y próximos pasos.</p>
      </header>

      {/* KPIs */}
      <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
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

      {/* Proyecto activo + columna de acciones y perfil */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
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

              {activo.hitos.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {activo.hitos.map((h: HitoResumen) => {
                    const meta = ESTADO_HITO[h.estado ?? ""] ?? {
                      dot: "bg-white/40",
                      label: h.estado ?? "",
                    };
                    const f = fechaCorta(h.fechaLimite);
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

              {equipoActivo.length > 0 && (
                <div className="mt-auto border-t border-white/10 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                    Equipo
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {equipoActivo.map((m) => (
                      <span
                        key={m.userId}
                        className="rounded-full bg-white/10 px-3 py-1 text-xs text-white"
                      >
                        {m.nombre}
                        {m.rol && <span className="text-white/50"> · {m.rol}</span>}
                      </span>
                    ))}
                  </div>
                </div>
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

        {/* Columna derecha: acciones + completar perfil (apiladas) */}
        <div className="flex flex-col gap-4">
          <Card title="Acciones pendientes">
            {acciones.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {acciones.map((h) => {
                  const venc = vencimiento(h.dias);
                  const urgente = h.dias !== null && h.dias <= 2;
                  return (
                    <li key={h.id}>
                      <Link
                        href={`/proyectos/${activo!.id}`}
                        className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-electric/40"
                      >
                        <span className="flex-1 truncate text-sm text-ink">
                          Entregar: {h.titulo}
                        </span>
                        {venc && (
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                              urgente
                                ? "bg-coral/15 text-coral"
                                : "bg-surface text-muted",
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
              <p className="text-sm text-muted">Sin acciones pendientes. 🎉</p>
            )}
          </Card>

          <Card title="Completa tu perfil" right={`${perfil.pct}%`}>
            <div className="h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-electric"
                style={{ width: `${perfil.pct}%` }}
              />
            </div>
            {perfil.faltan.length > 0 ? (
              <>
                <ul className="flex flex-col gap-2">
                  {perfil.faltan.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted">
                      <span className="size-1.5 rounded-full bg-coral" />
                      Falta: {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/perfil"
                  className="text-sm font-medium text-electric hover:underline"
                >
                  Completar perfil →
                </Link>
              </>
            ) : (
              <p className="text-sm text-sprout">Tu perfil está completo. ✓</p>
            )}
          </Card>
        </div>
      </div>

      {/* Widgets compactos */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-start">
        <Card title="Postulaciones">
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
            <p className="text-sm text-muted">Aún no te postulaste.</p>
          )}
          <Link
            href="/mis-postulaciones"
            className="text-sm font-medium text-electric hover:underline"
          >
            Ver todas →
          </Link>
        </Card>

        <Card title="Evaluaciones">
          {evaluaciones.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {evaluaciones.map((e) => (
                <li key={e.projectId} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-ink">
                      {e.titulo}
                    </span>
                    <Badge tone="brand">{e.puntaje} / 5</Badge>
                  </div>
                  {e.comentario && (
                    <p className="text-sm text-muted">{e.comentario}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">
              Al terminar un proyecto verás aquí la evaluación del gestor.
            </p>
          )}
        </Card>

        <Card
          title="Portafolio"
          right={`${portfolio.length} evidencia${portfolio.length === 1 ? "" : "s"}`}
        >
          {portfolio.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {portfolio.slice(0, 3).map((it) => (
                <li key={it.id} className="flex items-center gap-2 text-sm">
                  <span className="size-1.5 shrink-0 rounded-full bg-electric" />
                  <span className="truncate text-ink">{it.titulo}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Aún no cargaste evidencias.</p>
          )}
          <div className="flex items-center gap-3">
            <Link href="/perfil" className="text-sm font-medium text-electric hover:underline">
              Gestionar →
            </Link>
            {profile?.visibility === "publico" && profile?.id && (
              <Link
                href={`/u/${profile.id}`}
                className="text-sm font-medium text-muted hover:text-electric"
              >
                Ver pública
              </Link>
            )}
          </div>
        </Card>

        <Card title="Tus habilidades">
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <Badge key={s.skill_id} tone="neutral">
                  {s.skill?.nombre}
                  {s.nivel && (
                    <span className="text-muted/70"> · {NIVEL_LABEL[s.nivel] ?? s.nivel}</span>
                  )}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Declara lo que sabes hacer.</p>
          )}
          <Link
            href="/perfil"
            className="text-sm font-medium text-electric hover:underline"
          >
            {skills.length > 0 ? "Editar →" : "Agregar →"}
          </Link>
        </Card>
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

// Contenedor de widget con título y valor opcional a la derecha.
function Card({
  title,
  right,
  children,
}: {
  title: string;
  right?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink">{title}</h2>
        {right && <span className="text-sm font-semibold text-electric">{right}</span>}
      </div>
      {children}
    </div>
  );
}

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
