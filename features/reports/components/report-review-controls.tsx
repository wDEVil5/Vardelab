"use client";

import { useActionState } from "react";
import {
  markReportInReview,
  resolveReport,
  type ReportActionState,
} from "@/features/reports/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const INITIAL: ReportActionState = {};

/**
 * Acción sobre un reporte (M-04): marcarlo en revisión, y resolverlo con una
 * nota obligatoria (queda en `resolucion`, M22). No hay "ocultar comentario" ni
 * "advertir al usuario": no existe sistema de comentarios ni de advertencias en
 * el producto — no se simulan acciones que no hacen nada de verdad.
 */
export function ReportReviewControls({
  reportId,
  status,
}: {
  reportId: string;
  status: string;
}) {
  const [reviewState, reviewAction] = useActionState(markReportInReview, INITIAL);
  const [resolveState, resolveActionFn] = useActionState(resolveReport, INITIAL);

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
