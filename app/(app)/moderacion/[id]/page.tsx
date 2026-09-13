import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { getCurrentUser } from "@/features/auth/queries";
import { getProjectForModeration } from "@/features/projects/queries";
import { ModerationReviewControls } from "@/features/projects/components/moderation-review-controls";

export const metadata: Metadata = {
  title: "Revisar proyecto · CampusLab",
};

type PageProps = { params: Promise<{ id: string }> };

const MODALIDAD_LABEL: Record<string, string> = {
  remoto: "Remoto",
  presencial: "Presencial",
  hibrido: "Híbrido",
};

// Guía de lectura antes de decidir: no son casilleros que alguien marcó, es un
// recordatorio de qué mirar en el brief de al lado. Por eso llevan el mismo
// ícono neutro en todos — no hay un estado "verificado" que calcular.
const GUIA = [
  "El problema se entiende sin conocer el contexto interno de la organización.",
  "El alcance es acotado: se puede completar en la duración declarada.",
  "El entregable es concreto y se puede verificar al final.",
  "Los roles piden habilidades razonables para estudiantes.",
];

// Tiempo relativo desde que se creó el proyecto (no hay un timestamp propio de
// "cuándo entró a revisión" en el modelo).
function haceCuanto(iso: string): string {
  const horas = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (horas < 1) return "hace unos minutos";
  if (horas < 24) return `hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
}

/**
 * M-02 · Revisar proyecto. Detalle completo de un proyecto en revisión más el
 * panel de decisión (aprobar o rechazar con motivo). Si ya no está en revisión
 * —lo resolvió otro moderador mientras tanto, por ejemplo— vuelve a la cola.
 */
export default async function RevisarProyectoPage({ params }: PageProps) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  if (!user.esModerador && !user.esAdmin) redirect("/");

  const project = await getProjectForModeration(id);
  if (!project) redirect("/moderacion");

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 lg:py-10">
      <Link
        href="/moderacion"
        className="text-sm text-muted transition-colors hover:text-ink"
      >
        ← Cola de revisión
      </Link>

      <header className="mt-3 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink">Revisar proyecto</h1>
        <p className="text-sm text-muted">
          Valida alcance, claridad y qué tan razonable es para un estudiante.
        </p>
      </header>

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[1fr_20rem]">
        {/* Brief completo */}
        <div className="rounded-2xl border border-border bg-white p-7">
          {/* Encabezado del proyecto */}
          <div>
            <Badge tone="brand">En revisión</Badge>
            <h2 className="mt-4 text-2xl font-bold leading-tight text-ink">
              {project.titulo}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <span className="flex items-center gap-1.5 font-medium text-ink">
                {project.organization?.nombre}
                {project.organization?.verificacion === "verificado" && (
                  <VerifiedBadge />
                )}
              </span>
              <span aria-hidden>·</span>
              <span>{haceCuanto(project.created_at)}</span>
              <span aria-hidden>·</span>
              <span>
                {(project.modalidad && (MODALIDAD_LABEL[project.modalidad] ?? project.modalidad)) ||
                  "Modalidad por definir"}
                , {project.duracion_semanas} semanas
              </span>
            </div>
            {project.resumen && (
              <p className="mt-4 text-base leading-relaxed text-ink">
                {project.resumen}
              </p>
            )}
          </div>

          {/* Contexto de una ronda anterior (M36): solo aparece si el gestor ya
              había recibido observaciones y reenvió — ayuda a revisar sin
              tener que recordar qué se pidió la vez pasada. */}
          {project.comentario_moderacion && (
            <div className="mt-6 flex flex-col gap-4 rounded-xl border border-electric/20 bg-electric/5 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-electric">
                  Ronda anterior · lo que se pidió
                </p>
                <p className="mt-1.5 text-sm text-ink">
                  {project.comentario_moderacion}
                </p>
              </div>

              {project.observaciones && project.observaciones.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {project.observaciones.map((o) => (
                    <li
                      key={o.id}
                      className="flex items-start gap-2.5 rounded-lg bg-white p-3 text-sm"
                    >
                      <Badge tone={o.resuelta ? "success" : "neutral"} className="shrink-0">
                        {o.categoria}
                      </Badge>
                      <span className="text-ink">{o.texto}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted">
                        {o.resuelta ? "Marcada resuelta" : "Sin marcar"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {project.respuesta_patrocinador && (
                <div className="border-t border-electric/20 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-electric">
                    Respuesta del gestor
                  </p>
                  <p className="mt-1.5 text-sm text-ink">
                    {project.respuesta_patrocinador}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* El brief, en su propio bloque para separarlo del encabezado. */}
          <dl className="mt-7 flex flex-col gap-6 rounded-xl bg-surface p-5">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                Problema
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-ink">
                {project.problema}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                Alcance
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-ink">
                {project.alcance}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                Entregable
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-ink">
                {project.entregable}
              </dd>
            </div>
            {project.expectativas && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Expectativas
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-ink">
                  {project.expectativas}
                </dd>
              </div>
            )}
          </dl>

          {/* Roles, cada uno en su propia fila. */}
          {project.roles.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Roles
              </h3>
              <div className="mt-3 flex flex-col gap-2">
                {project.roles.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-lg border border-border p-3.5 text-sm"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="font-medium text-ink">{r.nombre}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {r.cupos} {r.cupos === 1 ? "cupo" : "cupos"}
                        {r.horas_semanales && ` · ${r.horas_semanales} h/semana`}
                      </span>
                    </div>
                    {r.descripcion && (
                      <p className="mt-1 text-muted">{r.descripcion}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guía de lectura */}
          <div className="mt-8 border-t border-border pt-7">
            <h3 className="text-lg font-semibold text-ink">Antes de decidir</h3>
            <ul className="mt-4 flex flex-col gap-4">
              {GUIA.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-electric/10 text-electric">
                    <svg
                      viewBox="0 0 24 24"
                      className="size-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  <span className="text-sm leading-relaxed text-ink">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Decisión */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">Decisión</h2>
          <p className="mt-1 text-sm text-muted">
            Aprobar publica el proyecto de inmediato.
          </p>
          <div className="mt-4">
            <ModerationReviewControls projectId={project.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
