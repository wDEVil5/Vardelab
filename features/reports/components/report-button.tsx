"use client";

import { useActionState, useState, type ReactNode } from "react";
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

const TARGET_LABEL: Record<"proyecto" | "perfil" | "organizacion", string> = {
  proyecto: "proyecto",
  perfil: "perfil",
  organizacion: "organización",
};

// "esta organización", no "este organización" (bug preexistente, corregido
// de paso al tocar este mismo texto).
const TARGET_ARTICULO: Record<"proyecto" | "perfil" | "organizacion", string> = {
  proyecto: "este",
  perfil: "este",
  organizacion: "esta",
};

/**
 * Botón discreto para reportar un proyecto, un perfil o una organización
 * (M7 + M22). Abre un modal con motivo (fijo) + descripción opcional;
 * requiere sesión (la Server Action redirige a ingresar si no hay). Queda en
 * manos de moderador/admin, que lo gestionan desde `/moderacion/reportes`.
 */
export function ReportButton({
  targetType,
  targetId,
  renderTrigger,
}: {
  targetType: "proyecto" | "perfil" | "organizacion";
  targetId: string;
  /**
   * Trigger custom (p. ej. un ítem dentro de un menú de tres puntitos, como
   * usa `MessageThread`), en vez del link de texto por defecto. Recibe la
   * función que abre el modal — el resto (form, envío, estado) es el mismo.
   */
  renderTrigger?: (open: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(submitReport, INITIAL);

  const etiqueta = TARGET_LABEL[targetType];
  const articulo = TARGET_ARTICULO[targetType];
  const titulo = `Reportar ${etiqueta}`;

  return (
    <>
      {renderTrigger ? (
        renderTrigger(() => setOpen(true))
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-muted underline-offset-2 transition-colors hover:text-coral hover:underline"
        >
          Reportar {articulo} {etiqueta}
        </button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={titulo}>
        {state.ok ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-ink">Gracias, lo vamos a revisar.</p>
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
