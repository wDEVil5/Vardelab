import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/features/auth/queries";
import { getManagedProject } from "@/features/projects/queries";
import { getTeamForEvaluation } from "@/features/evaluations/queries";
import {
  getMilestonesWithSubmissions,
  getRecentProjectActivity,
  type MilestoneWithSubmissions,
} from "@/features/milestones/queries";
import { AddMilestoneModal } from "@/features/milestones/components/add-milestone-modal";
import {
  ApproveMilestoneButton,
  ReturnMilestoneButton,
  DeleteMilestoneButton,
} from "@/features/milestones/components/milestone-actions";
import { getProjectMessages, getProjectParticipantNames } from "@/features/messages/queries";
import { MessageThread } from "@/features/messages/components/message-thread";

export const metadata: Metadata = {
  title: "Seguimiento de hitos · Vardelab",
};

// Estado del hito → etiqueta, tono del badge y estilo del círculo (mismo
// criterio que la vista del estudiante en `/proyecto/[projectId]`).
const HITO: Record<string, { label: string; tone: BadgeTone; circulo: string }> = {
  aprobado: { label: "Completado", tone: "success", circulo: "bg-sprout text-white" },
  entregado: { label: "En revisión", tone: "brand", circulo: "bg-electric text-white" },
  en_progreso: { label: "En progreso", tone: "brand", circulo: "bg-electric text-white" },
  pendiente: { label: "Pendiente", tone: "neutral", circulo: "bg-surface text-muted" },
};

// Fecha de actividad en términos relativos.
function haceCuanto(iso: string): string {
  const horas = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (horas < 1) return "Recién";
  if (horas < 24) return `Hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return "Ayer";
  if (dias < 7) return `Hace ${dias} días`;
  return `Hace ${Math.floor(dias / 7)} sem`;
}

// Semana actual dentro de la duración estimada, o `null` si el proyecto no
// declaró una duración. Se cuenta desde que se creó (no hay una fecha de
// "inicio" propia) y se limita a la duración total para no mostrar "semana 9
// de 4".
function semanaActual(createdAt: string, duracionSemanas: number | null): string | null {
  if (!duracionSemanas) return null;
  const diasTranscurridos = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / 86_400_000,
  );
  const actual = Math.min(Math.max(1, Math.ceil((diasTranscurridos + 1) / 7)), duracionSemanas);
  return `Semana ${actual} de ${duracionSemanas}`;
}

type PageProps = { params: Promise<{ id: string }> };

/** Seguimiento de hitos (S-05): progreso del proyecto, plan de hitos, actividad y mensajes. */
export default async function SeguimientoProyectoPage({ params }: PageProps) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/ingresar?next=/mis-proyectos/${id}/seguimiento`);

  const project = await getManagedProject(id);
  if (!project) notFound();

  const [equipo, hitos, actividad, mensajes, participantes] = await Promise.all([
    getTeamForEvaluation(project.id),
    getMilestonesWithSubmissions(project.id),
    getRecentProjectActivity(project.id),
    getProjectMessages(project.id),
    getProjectParticipantNames(project.id),
  ]);

  const totalHitos = hitos.length;
  const aprobados = hitos.filter((h) => h.estado === "aprobado").length;
  const progreso = totalHitos > 0 ? Math.round((aprobados / totalHitos) * 100) : 0;
  const equipoTamano = equipo?.length ?? 0;
  const semana = semanaActual(project.created_at, project.duracion_semanas);
  const redirectPath = `/mis-proyectos/${project.id}/seguimiento`;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:py-10">
      <Link
        href={`/mis-proyectos/${project.id}`}
        className="text-sm text-muted transition-colors hover:text-electric"
      >
        ← Volver al proyecto
      </Link>

      <header className="mt-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink">Seguimiento de hitos</h1>
        <p className="text-sm text-muted">Monitorea avances y desbloquea al equipo.</p>
      </header>

      <div className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-border bg-white p-6">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-ink">{project.titulo}</span>
          <span className="text-xs text-muted">
            {[semana, `equipo de ${equipoTamano}`].filter(Boolean).join(" · ")}
          </span>
        </div>
        <Badge tone={progreso === 100 ? "success" : "brand"}>
          {progreso}% completado
        </Badge>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="rounded-2xl border border-border bg-white p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-ink">Plan de hitos</h2>
            <AddMilestoneModal projectId={project.id} />
          </div>

          {totalHitos === 0 ? (
            <p className="mt-3 text-sm text-muted">
              Define los hitos del proyecto: el plan de trabajo por etapas.
            </p>
          ) : (
            <ol className="mt-4 flex flex-col gap-3">
              {hitos.map((hito, i) => (
                <MilestoneCard key={hito.id} hito={hito} numero={i + 1} projectId={project.id} />
              ))}
            </ol>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-white p-6">
            <h2 className="text-sm font-semibold text-ink">Actividad reciente</h2>
            {actividad.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Todavía no hay avances registrados.</p>
            ) : (
              <ul className="mt-3 flex flex-col">
                {actividad.map((a) => (
                  <li key={a.id} className="border-b border-border py-3 last:border-0">
                    <p className="text-sm text-ink">
                      <span className="font-medium">{a.actorNombre ?? "Alguien"}</span>{" "}
                      registró un avance
                    </p>
                    <p className="text-xs text-muted">
                      {haceCuanto(a.created_at)} · {a.milestoneTitulo}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Mensajes con el equipo (M30), en el lado derecho junto a la
              actividad reciente. */}
          <div className="rounded-2xl border border-border bg-white p-6">
            <h2 className="mb-3 text-sm font-semibold text-ink">Mensajes</h2>
            <MessageThread
              projectId={project.id}
              redirectPath={redirectPath}
              messages={mensajes}
              currentUserId={user.id}
              participantNames={participantes}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function MilestoneCard({
  hito,
  numero,
  projectId,
}: {
  hito: MilestoneWithSubmissions;
  numero: number;
  projectId: string;
}) {
  const est = HITO[hito.estado] ?? HITO.pendiente;
  const entregas = hito.submissions ?? [];
  const enRevision = hito.estado === "entregado";

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              est.circulo,
            )}
          >
            {hito.estado === "aprobado" || hito.estado === "entregado" ? (
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              numero
            )}
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-ink">{hito.titulo}</span>
            {hito.descripcion && <p className="text-sm text-muted">{hito.descripcion}</p>}
            {hito.fecha_limite && (
              <span className="text-xs text-muted">Fecha límite: {hito.fecha_limite}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge tone={est.tone}>{est.label}</Badge>
          <DeleteMilestoneButton milestoneId={hito.id} projectId={projectId}>
            Eliminar
          </DeleteMilestoneButton>
        </div>
      </div>

      {entregas.length > 0 && (
        <ul className="flex flex-col gap-2 border-t border-border pt-3">
          {entregas.map((s) => (
            <li key={s.id} className="flex flex-col gap-1 rounded-md bg-surface/60 p-3">
              {s.url && (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-electric hover:underline"
                >
                  {s.url}
                </a>
              )}
              {s.archivo_url && (
                <a
                  href={s.archivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-electric hover:underline"
                >
                  <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  Descargar archivo adjunto
                </a>
              )}
              {s.nota && <p className="text-xs text-muted">{s.nota}</p>}
            </li>
          ))}
        </ul>
      )}

      {enRevision && (
        <div className="flex items-start gap-2 border-t border-border pt-3">
          <ApproveMilestoneButton milestoneId={hito.id} projectId={projectId}>
            Aprobar
          </ApproveMilestoneButton>
          <ReturnMilestoneButton milestoneId={hito.id} projectId={projectId}>
            Pedir cambios
          </ReturnMilestoneButton>
        </div>
      )}
    </li>
  );
}
