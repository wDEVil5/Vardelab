"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteAccount, type DeleteAccountState } from "@/features/profile/actions";

const INITIAL: DeleteAccountState = {};
const FRASE_CONFIRMACION = "eliminar cuenta";

const CONSECUENCIAS: Record<"estudiante" | "patrocinador", string[]> = {
  estudiante: [
    "Tu perfil, habilidades y portafolio desaparecen.",
    "Sales de cualquier equipo activo y tus postulaciones (incluidas las que están en curso) se eliminan.",
    "Las evaluaciones que recibiste de organizaciones se pierden con tu cuenta.",
    "Los mensajes que enviaste quedan, pero sin tu nombre asociado.",
    "No podrás recuperar nada de esto después.",
  ],
  patrocinador: [
    "Tu perfil y datos de cuenta desaparecen.",
    "Sales de las organizaciones donde eres miembro.",
    "Los proyectos que creaste y las evaluaciones que hiciste se mantienen, pero sin tu nombre asociado.",
    "Los mensajes que enviaste quedan, pero sin tu nombre asociado.",
    "No podrás recuperar nada de esto después.",
  ],
};

/**
 * Confirmación de borrado de cuenta en un modal: es una decisión con más peso
 * que un borrado cualquiera (se lleva puesto historial real), así que explica
 * en detalle qué se pierde y exige escribir una frase para habilitar el botón,
 * en vez de un simple confirmar/cancelar.
 */
export function DeleteAccountDialog({ rol }: { rol: "estudiante" | "patrocinador" }) {
  const [open, setOpen] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [state, formAction, pending] = useActionState(deleteAccount, INITIAL);
  const confirmado = confirmacion.trim().toLowerCase() === FRASE_CONFIRMACION;

  return (
    <>
      <div className="flex flex-col gap-2 rounded-lg border border-coral/30 bg-coral/5 p-5">
        <p className="text-sm font-medium text-ink">Eliminar cuenta</p>
        <p className="text-xs text-muted">
          Borra tu perfil, postulaciones y datos personales. Esta acción no se
          puede deshacer.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="self-start rounded-lg border border-coral/40 px-4 py-2 text-sm font-medium text-coral transition-colors hover:bg-coral/10"
        >
          Eliminar cuenta
        </button>
      </div>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setConfirmacion("");
        }}
        busy={pending}
        title="¿Eliminar tu cuenta?"
      >
        <form action={formAction} className="space-y-5" aria-busy={pending}>
          <p className="text-sm leading-relaxed text-ink">
            Esta acción es permanente y no se puede deshacer. Al eliminar tu
            cuenta:
          </p>
          <ul className="space-y-2 text-sm leading-relaxed text-muted">
            {CONSECUENCIAS[rol].map((texto) => (
              <li key={texto}>• {texto}</li>
            ))}
          </ul>

          {state.error ? (
            <p role="alert" className="text-sm text-coral">
              {state.error}
            </p>
          ) : (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-ink">
                Escribe <span className="font-semibold">&quot;{FRASE_CONFIRMACION}&quot;</span> para confirmar
              </span>
              <Input
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                autoComplete="off"
                disabled={pending}
              />
            </label>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setConfirmacion("");
              }}
            >
              Cancelar
            </Button>
            {!state.error && (
              <SubmitButton
                variant="danger"
                className="min-h-11"
                pendingText="Eliminando cuenta…"
                disabled={!confirmado}
              >
                Sí, eliminar mi cuenta
              </SubmitButton>
            )}
          </div>
        </form>
      </Modal>
    </>
  );
}
