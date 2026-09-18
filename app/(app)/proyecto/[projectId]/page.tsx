import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/features/auth/queries";
import { getMyTeams } from "@/features/teams/queries";
import { getProjectMilestones } from "@/features/milestones/queries";
import { getProjectMessages, getProjectParticipantNames } from "@/features/messages/queries";
import { MessageThread } from "@/features/messages/components/message-thread";
import { getMyEvaluationsByProject } from "@/features/evaluations/queries";
import { EvaluationSummary } from "@/features/evaluations/components/evaluation-summary";
import { ProjectProgressBar } from "@/features/projects/components/project-progress-bar";
import { projectStatusLabel } from "@/features/projects/status";

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

function estaVencido(fechaLimite: string | null, estado: string): boolean {
  if (!fechaLimite || estado === "aprobado") return false;
  return new Date(fechaLimite + "T23:59:59").getTime() < Date.now();
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

  const [hitos, mensajes, participantes, evaluaciones] = await Promise.all([
    getProjectMilestones(projectId),
    getProjectMessages(projectId),
    getProjectParticipantNames(projectId),
    getMyEvaluationsByProject(),
  ]);
  const miEvaluacion = evaluaciones.get(projectId) ?? null;
  const total = hitos.length;
  const aprobados = hitos.filter((h) => h.estado === "aprobado").length;
  const progreso = total > 0 ? Math.round((aprobados / total) * 100) : 0;
  const accionable = hitos.find((h) => h.estado !== "aprobado") ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:py-10">
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
        <p className="text-sm text-muted">{equipo.projectTitulo} · {projectStatusLabel(equipo.projectStatus)}</p>
      </header>

      {/* Barra de progreso + equipo, en la misma tarjeta — con equipos chicos,
          una tarjeta aparte para "Equipo" se sentía vacía. Los avatares (sin
          nombre visible, más grandes que antes para que tengan presencia real)
          muestran nombre y rol al pasar el mouse. El número y el llenado de la
          barra animan al montar, mismo efecto que el medidor del inicio. */}
      <ProjectProgressBar pct={progreso} orgName={equipo.projectOrg}>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-xs font-medium tracking-wide text-muted uppercase">
            Equipo ({equipo.members.length})
          </span>
          {equipo.members.map((m) => (
            <div key={m.userId} className="group/miembro relative">
              <span className="flex size-14 cursor-default items-center justify-center rounded-full bg-surface text-base font-semibold text-ink ring-2 ring-transparent transition-all duration-200 group-hover/miembro:ring-electric/30">
                {iniciales(m.nombre)}
              </span>
              {/* Tarjeta de datos: oculta y un poco más arriba, se desliza y
                  aparece suave al pasar el mouse — mismo criterio que
                  `InfoTooltip`, con nombre de grupo propio para no activarse
                  con el hover de un ancestro ajeno. */}
              <div className="pointer-events-none absolute top-full left-1/2 z-10 mt-2 w-max max-w-56 -translate-x-1/2 translate-y-1 rounded-lg bg-ink px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-all duration-200 group-hover/miembro:translate-y-0 group-hover/miembro:opacity-100">
                <p className="font-semibold">
                  {m.nombre}
                  {m.esYo && " (Tú)"}
                </p>
                {m.rol && <p className="text-white/70">{m.rol}</p>}
              </div>
            </div>
          ))}
        </div>
      </ProjectProgressBar>

      {/* Dos bloques: a la izquierda el trabajo del proyecto (hitos, avance,
          evaluación); a la derecha el chat con la organización, a toda la
          altura de la fila (sin `items-start`, la grilla estira las dos
          columnas por igual) — así usa el espacio que antes quedaba vacío al
          lado de Hitos en vez de ser una tarjeta más, corta, sola. */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          {/* Hitos: misma altura fija que el chat, con scroll interno propio
              en vez de una lista que crece sin límite — un plan de trabajo
              largo no debería estirar la página entera. El degradado blanco
              al final es la pista visual de que hay más para scrollear
              (sobre una lista corta no se nota nada, porque ahí ya no hay
              contenido debajo que tapar). "Registrar avance" queda fijo
              abajo, fuera del scroll, igual que el campo de escribir del
              chat. */}
          <section className="flex h-140 flex-col rounded-2xl border border-border bg-white p-6">
            <h2 className="shrink-0 text-lg font-semibold text-ink">Hitos</h2>

            {total === 0 ? (
              <p className="mt-3 text-sm text-muted">
                La organización todavía no definió los hitos del proyecto.
              </p>
            ) : (
              <div className="relative min-h-0 flex-1">
                {/* Sin líneas separadoras entre filas: combinadas con el
                    fondo redondeado del hover se veían mal (el borde recto
                    cortaba la esquina redondeada por dentro). El espacio
                    entre filas (`gap-1`) ya separa visualmente sin necesitar
                    una línea. El hito actual (el que sigue por trabajar)
                    queda resaltado siempre, no solo al pasar el mouse. */}
                <ol className="flex h-full flex-col gap-1 overflow-y-auto pr-3 -mr-3">
                  {hitos.map((h, i) => {
                    const vencido = estaVencido(h.fecha_limite, h.estado);
                    const est = HITO[h.estado] ?? HITO.pendiente;
                    const aprobado = h.estado === "aprobado";
                    const esActual = accionable?.id === h.id;
                    return (
                      <li key={h.id} className="shrink-0">
                        {/* Aprobado también lleva a "Entregar evidencia" —
                            ahí queda en modo solo lectura (historial + aviso
                            de aprobado, sin formulario para entregar de
                            nuevo). Antes el link estaba bloqueado
                            (`pointer-events-none`) y no había forma de volver
                            a ver lo que se entregó en un hito ya cerrado. */}
                        <Link
                          href={`/proyecto/${projectId}/entregar/${h.id}`}
                          className={cn(
                            "flex items-start gap-4 rounded-lg px-3 py-4 transition-colors hover:bg-surface/60",
                            aprobado && "opacity-90",
                            esActual &&
                              (vencido
                                ? "bg-coral/5 ring-1 ring-inset ring-coral/25 hover:bg-coral/10"
                                : "bg-electric/5 ring-1 ring-inset ring-electric/25 hover:bg-electric/10"),
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                              esActual ? "bg-electric text-white" : est.circulo,
                            )}
                          >
                            {i + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-ink">{h.titulo}</p>
                              {esActual && !vencido && (
                                <span
                                  className="rounded-full bg-electric/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-electric uppercase"
                                >
                                  Ahora
                                </span>
                              )}
                            </div>
                            {h.descripcion && (
                              <p className="mt-0.5 text-sm text-muted">{h.descripcion}</p>
                            )}
                            {h.fecha_limite && (
                              <p className={cn("mt-1 text-xs", vencido ? "font-medium text-coral" : "text-muted")}>
                                {vencido ? "Vencido · " : ""}Fecha límite: {h.fecha_limite}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-medium",
                                est.badge,
                              )}
                            >
                              {est.label}
                            </span>
                            {vencido && (
                              <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-medium text-coral">
                                Vencido
                              </span>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-white to-transparent"
                />
              </div>
            )}

            {accionable && (
              <>
                <Link
                  href={`/proyecto/${projectId}/entregar/${accionable.id}`}
                  className={cn(buttonClasses({ variant: "primary" }), "mt-4 shrink-0")}
                >
                  Registrar avance
                </Link>
                {estaVencido(accionable.fecha_limite, accionable.estado) && (
                  <p className="mt-2 text-center text-xs text-coral">
                    Este hito está vencido, pero todavía puedes registrar un avance.
                  </p>
                )}
              </>
            )}
          </section>

          {/* Evaluación del gestor (S-06/M39): solo aparece si ya te evaluaron. */}
          {miEvaluacion && (
            <section className="rounded-2xl border border-border bg-white p-6">
              <h2 className="mb-3 text-lg font-semibold text-ink">Tu evaluación</h2>
              <EvaluationSummary evaluation={miEvaluacion} />
            </section>
          )}
        </div>

        {/* Mensajes con la organización (M30), con una altura fija de
            verdad — no basta con que la grilla "estire" la columna al alto de
            Hitos: eso solo define un mínimo, así que con muchos mensajes el
            contenido igual empujaba toda la fila hacia abajo en vez de hacer
            scroll interno. Con una altura fija, el `overflow-y-auto` de la
            lista de mensajes tiene un tope real contra el cual activarse. */}
        <section className="flex h-140 flex-col rounded-2xl border border-border bg-white p-6">
          <h2 className="mb-3 shrink-0 text-sm font-semibold text-ink">Mensajes</h2>
          <MessageThread
            projectId={projectId}
            redirectPath={`/proyecto/${projectId}`}
            messages={mensajes}
            currentUserId={user.id}
            participantNames={participantes}
            variant="fill"
          />
        </section>
      </div>
    </div>
  );
}
