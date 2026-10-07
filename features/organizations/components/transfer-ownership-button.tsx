"use client";

import { useActionState, useState } from "react";
import {
  offerOrganizationOwnership,
  type OwnershipState,
} from "@/features/organizations/actions";
import { Button, buttonClasses } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

const INITIAL: OwnershipState = {};

/**
 * Ofrecer la propiedad a un miembro activo. Confirmación en modal (no inline):
 * la fila de miembros es angosta y el texto de advertencia competía con el
 * nombre de al lado (llegó a cortarlo a "V e" en pruebas reales). El modal deja
 * espacio para explicar qué implica antes de que el botón de confirmar
 * siquiera exista en pantalla.
 *
 * Se cierra solo al ofrecer con éxito: a diferencia de quitar a alguien, este
 * botón sigue montado después (la fila de miembros no cambia), así que hace
 * falta el ajuste de estado durante el render para no dejarlo abierto.
 */
export function TransferOwnershipButton({
  orgId,
  newOwnerId,
  nombre,
}: {
  orgId: string;
  newOwnerId: string;
  nombre: string;
}) {
  const [state, formAction] = useActionState(offerOrganizationOwnership, INITIAL);
  const [open, setOpen] = useState(false);
  const [okVisto, setOkVisto] = useState(state.ok);
  if (state.ok !== okVisto) {
    setOkVisto(state.ok);
    if (state.ok) setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${buttonClasses({ variant: "outline-primary", size: "sm" })} whitespace-nowrap`}
      >
        Ofrecer propiedad
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="¿Ofrecer la propiedad?">
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2.5 text-sm text-ink">
            <li>
              <strong>{nombre}</strong> recibe una notificación y un correo con
              la oferta.
            </li>
            <li>
              La propiedad cambia solo si la acepta. Mientras tanto, sigues
              siendo el dueño.
            </li>
            <li>Si la acepta, pasas a ser miembro de la organización.</li>
          </ul>

          {state.error && (
            <p role="alert" className="text-sm text-coral">
              {state.error}
            </p>
          )}

          <form action={formAction} className="flex justify-end gap-2">
            <input type="hidden" name="orgId" value={orgId} />
            <input type="hidden" name="newOwnerId" value={newOwnerId} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              Cancelar
            </button>
            <Button type="submit" variant="primary" size="sm">
              Sí, ofrecer
            </Button>
          </form>
        </div>
      </Modal>
    </>
  );
}
