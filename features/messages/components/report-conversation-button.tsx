"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/ui/submit-button";
import { submitReport, type SubmitReportState } from "@/features/reports/actions";

const INITIAL: SubmitReportState = {};

// Motivo fijo: a diferencia de `ReportButton` (ficha de proyecto/perfil/
// organización), acá no se pide elegir uno — el contexto real es la
// conversación completa, que el moderador puede revisar entera desde
// `/moderacion/proyecto/[projectId]/mensajes` (M100).
const MOTIVO_CONVERSACION = "Reportado desde la conversación del proyecto";

/**
 * Reportar directo desde el hilo de mensajes (M100). Deliberadamente un
 * componente propio, no una variante de `ReportButton` (la función general
 * de reportar, compartida por fichas de proyecto/perfil/organización, fuera
 * de alcance de este cambio) — acá el modal es solo informativo, sin
 * formulario: sin motivo a elegir ni descripción que escribir, un solo paso
 * hasta confirmar.
 */
export function ReportConversationButton({
  projectId,
  renderTrigger,
}: {
  projectId: string;
  /**
   * Igual que `ReportButton`: recibe la función que abre el modal, para que
   * el trigger (acá, un ítem dentro de `ConversationMenu`) pueda vivir en
   * otro árbol y cerrarse sin desmontar este componente — si el modal
   * viviera dentro del panel del menú, cerrar el menú al hacer click lo
   * desmontaría antes de llegar a abrirse.
   */
  renderTrigger: (open: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(submitReport, INITIAL);

  return (
    <>
      {renderTrigger(() => setOpen(true))}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="¿Reportar esta conversación?"
      >
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
          <form action={formAction} className="flex flex-col gap-5">
            <input type="hidden" name="targetType" value="conversacion" />
            <input type="hidden" name="targetId" value={projectId} />
            <input type="hidden" name="motivo" value={MOTIVO_CONVERSACION} />

            <p className="text-sm leading-relaxed text-ink">
              Antes de confirmar, esto es lo que pasa después:
            </p>
            <ul className="space-y-2 text-sm leading-relaxed text-muted">
              <li>
                • Un moderador va a revisar la conversación completa de este
                proyecto.
              </li>
              <li>
                • Puedes ver el estado (en revisión, resuelto) desde
                &quot;Mis reportes&quot;.
              </li>
              <li>• A quien reportas no se le avisa que lo reportaste.</li>
            </ul>

            {state.error && (
              <p role="alert" className="text-sm text-coral">
                {state.error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface"
              >
                Cancelar
              </button>
              <SubmitButton variant="danger" className="min-h-11" pendingText="Enviando…">
                Reportar
              </SubmitButton>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
