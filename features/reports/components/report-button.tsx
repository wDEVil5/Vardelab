"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { submitReport, type SubmitReportState } from "@/features/reports/actions";

const INITIAL: SubmitReportState = {};

const MOTIVOS = [
  "Contenido inapropiado",
  "Información engañosa o falsa",
  "Posible fraude o estafa",
  "Suplantación de identidad",
  "Otro",
];

/**
 * Botón discreto para reportar un proyecto o un perfil (M7 + M22). Abre un
 * modal con motivo (fijo) + descripción opcional; requiere sesión (la Server
 * Action redirige a ingresar si no hay). Queda en manos de moderador/admin,
 * que lo gestionan desde `/moderacion/reportes`.
 */
export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: "proyecto" | "perfil";
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(submitReport, INITIAL);

  const titulo = targetType === "proyecto" ? "Reportar proyecto" : "Reportar perfil";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted underline-offset-2 transition-colors hover:text-coral hover:underline"
      >
        {targetType === "proyecto" ? "Reportar este proyecto" : "Reportar este perfil"}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={titulo}>
        {state.ok ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-ink">
              Gracias, lo vamos a revisar.
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-electric hover:underline"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="targetType" value={targetType} />
            <input type="hidden" name="targetId" value={targetId} />

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">Motivo</span>
              <select
                name="motivo"
                required
                defaultValue=""
                className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-ink focus:border-electric focus:outline-none"
              >
                <option value="" disabled>
                  Elige un motivo
                </option>
                {MOTIVOS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">
                Descripción <span className="text-muted">(opcional)</span>
              </span>
              <Textarea
                name="descripcion"
                placeholder="Cuéntanos más, si ayuda a entender el caso."
                className="min-h-24"
              />
            </label>

            {state.error && (
              <p role="alert" className="text-sm text-coral">
                {state.error}
              </p>
            )}

            <SubmitButton className="w-full" pendingText="Enviando…">
              Enviar reporte
            </SubmitButton>
          </form>
        )}
      </Modal>
    </>
  );
}
