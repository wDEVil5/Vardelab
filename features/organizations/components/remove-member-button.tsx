"use client";

import { useActionState, useState } from "react";
import { removeOrganizationMember, type RemoveMemberState } from "@/features/organizations/actions";
import { Button, buttonClasses } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

const INITIAL: RemoveMemberState = {};

/**
 * Botón "Quitar" con confirmación en modal (no inline): deja de gestionar la
 * organización, así que no es algo para borrar sin querer, y la fila de
 * miembros es angosta para explicar bien qué implica.
 *
 * No hace falta cerrar el modal manualmente al tener éxito: la fila
 * desaparece de la lista al quitar a la persona, así que el componente entero
 * se desmonta.
 */
export function RemoveMemberButton({
  memberId,
  orgId,
  nombre,
}: {
  memberId: string;
  orgId: string;
  nombre: string;
}) {
  const [state, formAction] = useActionState(removeOrganizationMember, INITIAL);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClasses({ variant: "ghost", size: "sm" })}
      >
        Quitar
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="¿Quitar a este miembro?">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink">
            <strong>{nombre}</strong> deja de tener acceso a la organización de
            inmediato. Puedes volver a invitarla cuando quieras.
          </p>

          {state.error && (
            <p role="alert" className="text-sm text-coral">
              {state.error}
            </p>
          )}

          <form action={formAction} className="flex justify-end gap-2">
            <input type="hidden" name="memberId" value={memberId} />
            <input type="hidden" name="orgId" value={orgId} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              Cancelar
            </button>
            <Button type="submit" variant="danger" size="sm">
              Sí, quitar
            </Button>
          </form>
        </div>
      </Modal>
    </>
  );
}
