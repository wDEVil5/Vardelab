"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { OrgLogo } from "@/components/ui/org-logo";
import { SubmitButton } from "@/components/ui/submit-button";
import { Modal } from "@/components/ui/modal";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { withdrawApplication, type WithdrawApplicationState } from "@/features/applications/actions";
import type { MyApplication } from "@/features/applications/queries";

const WITHDRAW_INITIAL: WithdrawApplicationState = {};

// Estado de la postulación → etiqueta y tono del badge.
const ESTADO: Record<string, { label: string; tone: BadgeTone }> = {
  enviada: { label: "En revisión", tone: "brand" },
  aceptada: { label: "Aceptada", tone: "success" },
  rechazada: { label: "Rechazada", tone: "danger" },
  retirada: { label: "Retirada", tone: "neutral" },
  removida: { label: "Ya no en el equipo", tone: "neutral" },
};

type FiltroId = "todas" | "enviada" | "aceptada" | "cerradas";

const FILTROS: { id: FiltroId; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "enviada", label: "En revisión" },
  { id: "aceptada", label: "Aceptadas" },
  { id: "cerradas", label: "Cerradas" },
];

/** Ícono de flecha, para el acceso directo a un proyecto ya aceptado. */
function IconFlecha({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function coincide(status: string, filtro: FiltroId): boolean {
  if (filtro === "todas") return true;
  if (filtro === "cerradas") {
    return status === "rechazada" || status === "retirada" || status === "removida";
  }
  return status === filtro;
}

// Fecha de postulación en términos relativos y sin ambigüedad.
function haceCuanto(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 7) return `Hace ${dias} días`;
  if (dias < 30) return `Hace ${Math.floor(dias / 7)} sem`;
  const meses = Math.floor(dias / 30);
  return meses <= 1 ? "Hace 1 mes" : `Hace ${meses} meses`;
}

/**
 * Tabla del embudo de postulaciones (S-04): filtro por estado y una fila por
 * postulación (proyecto, rol, estado y fecha). Es solo seguimiento del embudo;
 * el trabajo del proyecto (hitos y entregas) vive en "En curso".
 */
export function ApplicationsTable({ apps }: { apps: MyApplication[] }) {
  const [filtro, setFiltro] = useState<FiltroId>("todas");
  const [retirarId, setRetirarId] = useState<string | null>(null);
  const [withdrawState, withdrawAction] = useActionState(withdrawApplication, WITHDRAW_INITIAL);
  const visibles = apps.filter((a) => coincide(a.status, filtro));
  const postulacionParaRetirar = apps.find((a) => a.id === retirarId);

  // El modal se cierra recién cuando el retiro sí funcionó — antes se cerraba
  // apenas se enviaba el form (`onSubmit`), así que un error nunca llegaba a
  // mostrarse: el modal ya había desaparecido para cuando la Server Action
  // respondía. Ajuste de estado durante el render (no en un efecto): React
  // lo trata como parte del mismo render, sin el "cascading render" que sí
  // tendría un `setState` dentro de `useEffect`.
  const [withdrawStateVisto, setWithdrawStateVisto] = useState(withdrawState);
  if (withdrawState !== withdrawStateVisto) {
    setWithdrawStateVisto(withdrawState);
    if (withdrawState.ok) setRetirarId(null);
  }

  const conteo = (f: FiltroId) =>
    apps.filter((a) => coincide(a.status, f)).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Filtros: control segmentado con contadores. */}
      <div
        role="group"
        aria-label="Filtrar por estado"
        className="inline-flex flex-wrap gap-1 self-start rounded-full bg-surface p-1"
      >
        {FILTROS.map((f) => {
          const activo = filtro === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={activo}
              onClick={() => setFiltro(f.id)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                activo ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
              )}
            >
              {f.label}
              <span className="text-xs tabular-nums text-muted/70">
                {conteo(f.id)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        {/* Cabecera (solo desktop). Alineada con las columnas de cada fila. */}
        <div className="hidden items-center gap-4 border-b border-border bg-surface/40 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted md:flex">
          <span className="flex-1">Proyecto</span>
          <span className="w-32 shrink-0">Rol</span>
          <span className="w-36 shrink-0">Estado</span>
          <span className="w-20 shrink-0 text-right">Postulado</span>
          <span className="w-20 shrink-0 text-right">Acción</span>
        </div>

        {visibles.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-muted">
              {apps.length === 0
                ? "Todavía no postulaste a nada."
                : "No hay postulaciones en este estado."}
            </p>
            {apps.length === 0 && (
              <Link
                href="/proyectos"
                className="mt-2 inline-block text-sm font-medium text-electric hover:underline"
              >
                Ver proyectos
              </Link>
            )}
          </div>
        ) : (
          <>
          <ul>
            {visibles.map((a) => {
              const estado = ESTADO[a.status] ?? {
                label: a.status,
                tone: "neutral" as BadgeTone,
              };
              const proyecto = a.role?.project;
              const org = proyecto?.organization;
              const aceptada = a.status === "aceptada";
              return (
                <li
                  key={a.id}
                  className={cn(
                    "flex items-center gap-4 border-b border-border px-5 py-4 transition-colors last:border-0 hover:bg-surface/40",
                    // Resaltado sutil para lo que ya está aceptado — es el
                    // estado que más importa encontrar de un vistazo, no uno
                    // más entre los demás.
                    aceptada && "bg-sprout/5 hover:bg-sprout/10",
                  )}
                >
                  {/* Proyecto: logo de la organización + título + nombre */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <OrgLogo
                      logoUrl={org?.logo_url}
                      nombre={org?.nombre ?? proyecto?.titulo ?? ""}
                      size="md"
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/proyectos/${proyecto?.id}`}
                        className="block truncate font-semibold text-ink hover:text-electric"
                      >
                        {proyecto?.titulo}
                      </Link>
                      {org?.nombre && (
                        <p className="truncate text-xs text-muted">{org.nombre}</p>
                      )}
                    </div>
                  </div>

                  {/* Rol (desktop) */}
                  <span className="hidden w-32 shrink-0 truncate text-sm text-muted md:block">
                    {a.role?.nombre}
                  </span>

                  {/* Estado: la acción de retirar vive separada al extremo
                      derecho para no competir visualmente con el badge. */}
                  <div className="flex w-auto shrink-0 flex-col items-start gap-1.5 md:w-36">
                    <Badge tone={estado.tone}>{estado.label}</Badge>
                  </div>

                  {/* Fecha (desktop) */}
                  <span className="hidden w-20 shrink-0 text-right text-sm text-muted md:block">
                    {haceCuanto(a.created_at)}
                  </span>

                  {/* Acción contextual: retirar queda en la columna final,
                      junto al acceso al espacio de trabajo cuando corresponde. */}
                  <span className="flex w-20 shrink-0 justify-end">
                    {a.status === "enviada" ? (
                      <button
                        type="button"
                        onClick={() => setRetirarId(a.id)}
                        className={buttonClasses({ variant: "ghost", size: "sm" }) + " px-2 text-xs"}
                      >
                        Retirar
                      </button>
                    ) : aceptada && proyecto?.id ? (
                      <Link
                        href={`/proyecto/${proyecto.id}`}
                        aria-label="Ir al proyecto"
                        title="Ir al proyecto"
                        className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-electric/10 hover:text-electric"
                      >
                        <IconFlecha className="size-4" />
                      </Link>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
          {postulacionParaRetirar && (
            <Modal
              open
              onClose={() => setRetirarId(null)}
              title="Retirar postulación"
            >
              <div className="flex flex-col gap-4">
                <p className="text-sm leading-relaxed text-ink">
                  ¿Quieres retirar tu postulación a{" "}
                  <strong>{postulacionParaRetirar.role?.project?.titulo}</strong>?
                </p>
                <p className="text-sm text-muted">
                  La organización dejará de verla como una postulación activa.
                  Podrás volver a postular más adelante si el proyecto sigue
                  abierto.
                </p>
                <form action={withdrawAction} className="flex justify-end gap-2">
                  <input
                    type="hidden"
                    name="applicationId"
                    value={postulacionParaRetirar.id}
                  />
                  <button
                    type="button"
                    onClick={() => setRetirarId(null)}
                    className={buttonClasses({ variant: "ghost", size: "sm" })}
                  >
                    Cancelar
                  </button>
                  <SubmitButton
                    variant="danger"
                    size="sm"
                    pendingText="Retirando…"
                  >
                    Retirar postulación
                  </SubmitButton>
                </form>
                {withdrawState.error && (
                  <p role="alert" className="text-right text-sm text-coral">
                    {withdrawState.error}
                  </p>
                )}
              </div>
            </Modal>
          )}
          </>
        )}
      </div>
    </div>
  );
}
