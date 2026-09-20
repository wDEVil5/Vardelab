"use client";

import { useState } from "react";
import { useActionState } from "react";
import {
  escalateReport,
  markReportInReview,
  resolveReport,
  type ReportActionState,
} from "@/features/reports/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const INITIAL: ReportActionState = {};

// Tiempo relativo, sin ambigüedad (mismo criterio que el resto de esta
// pantalla — ver DetalleReportePage).
function haceCuanto(iso: string): string {
  const horas = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (horas < 1) return "hace unos minutos";
  if (horas < 24) return `hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
}

/**
 * Acción sobre un reporte (M-04): marcarlo en revisión, escalarlo a admin
 * (M93, no cambia `status`) y resolverlo con una nota obligatoria (queda en
 * `resolucion`, M22). No hay "ocultar comentario" ni "advertir al usuario":
 * no existe sistema de comentarios ni de advertencias en el producto — no se
 * simulan acciones que no hacen nada de verdad.
 */
export function ReportReviewControls({
  reportId,
  status,
  escaladoAdmin,
  escaladoNota,
  escaladoAt,
  esAdmin,
}: {
  reportId: string;
  status: string;
  escaladoAdmin: boolean;
  escaladoNota: string | null;
  escaladoAt: string | null;
  esAdmin: boolean;
}) {
  const [reviewState, reviewAction] = useActionState(markReportInReview, INITIAL);
  const [escalateState, escalateAction] = useActionState(escalateReport, INITIAL);
  const [resolveState, resolveActionFn] = useActionState(resolveReport, INITIAL);
  const [escalarAbierto, setEscalarAbierto] = useState(false);

  if (status === "resuelto") {
    return <p className="text-sm text-muted">Este reporte ya está resuelto.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {status === "abierto" && (
        <form action={reviewAction}>
          <input type="hidden" name="reportId" value={reportId} />
          <Button type="submit" variant="secondary" className="w-full">
            Marcar en revisión
          </Button>
          {reviewState.error && (
            <p role="alert" className="mt-2 text-sm text-coral">
              {reviewState.error}
            </p>
          )}
        </form>
      )}

      {escaladoAdmin ? (
        <div className="rounded-xl border border-electric/25 bg-electric/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-electric">
            Escalado a admin{escaladoAt ? ` · ${haceCuanto(escaladoAt)}` : ""}
          </p>
          <p className="mt-1.5 text-sm text-ink">{escaladoNota}</p>
        </div>
      ) : (
        // Escalar es para que un moderador le pase el caso a un admin — un
        // admin ya es el destino final, no tiene a quién escalarle (M93).
        !esAdmin && (
          <div className="overflow-hidden rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setEscalarAbierto((v) => !v)}
              aria-expanded={escalarAbierto}
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-surface/60"
            >
              <span className="text-sm font-medium text-ink">Escalar a admin</span>
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className={cn(
                  "size-4 shrink-0 text-muted transition-transform duration-300",
                  escalarAbierto && "rotate-180",
                )}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                escalarAbierto ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <form action={escalateAction} className="flex flex-col gap-3 px-4 pb-4">
                  <input type="hidden" name="reportId" value={reportId} />
                  <Textarea
                    name="nota"
                    required
                    placeholder="Por qué este caso necesita que lo vea un admin."
                    className="min-h-20"
                  />
                  {escalateState.error && (
                    <p role="alert" className="text-sm text-coral">
                      {escalateState.error}
                    </p>
                  )}
                  <Button type="submit" variant="outline" className="w-full">
                    Escalar a admin
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )
      )}

      <form action={resolveActionFn} className="flex flex-col gap-3">
        <input type="hidden" name="reportId" value={reportId} />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Nota interna</span>
          <Textarea
            name="resolucion"
            required
            placeholder="Qué se hizo o se decidió."
            className="min-h-28"
          />
        </label>
        {resolveState.error && (
          <p role="alert" className="text-sm text-coral">
            {resolveState.error}
          </p>
        )}
        <Button type="submit" className="w-full">
          Resolver reporte
        </Button>
      </form>
    </div>
  );
}
