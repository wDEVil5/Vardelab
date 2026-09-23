"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

/**
 * Confirmación antes de entrar a la conversación de un proyecto desde un
 * reporte (M100): es información privada de terceros (el equipo, quien
 * gestiona el proyecto), así que explica qué va a ver quien confirma y deja
 * claro que el acceso queda registrado, antes de navegar.
 */
export function ViewConversationLink({
  projectId,
  reportId,
}: {
  projectId: string;
  reportId: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 block text-sm font-medium text-electric hover:underline"
      >
        Ver conversación del proyecto →
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="¿Ver la conversación del proyecto?"
      >
        <div className="flex flex-col gap-5">
          <p className="text-sm leading-relaxed text-ink">
            Vas a entrar al hilo de mensajes de este proyecto, en modo solo
            lectura. Vas a ver:
          </p>
          <ul className="space-y-2 text-sm leading-relaxed text-muted">
            <li>
              • Toda la conversación entre el equipo y quien gestiona el
              proyecto, no solo el mensaje que motivó el reporte.
            </li>
            <li>• Sin poder escribir ni participar, solo mirar.</li>
            <li>
              • Este acceso queda registrado en la auditoría: quién lo abrió,
              cuándo, y desde qué reporte.
            </li>
          </ul>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="min-h-11"
              onClick={() =>
                router.push(
                  `/moderacion/proyecto/${projectId}/mensajes?reportId=${reportId}`,
                )
              }
            >
              Ver conversación
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
