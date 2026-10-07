"use client";

import { useActionState, useState } from "react";
import {
  deleteOrganization,
  type DeleteOrgState,
} from "@/features/organizations/actions";
import { Button, buttonClasses } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

const INITIAL: DeleteOrgState = {};

/**
 * Botón de eliminación de organización con confirmación en modal. Muestra el
 * error de la guarda del servidor (sin proyectos) si aplica.
 */
export function DeleteOrgButton({ orgId }: { orgId: string }) {
  const [state, formAction] = useActionState(deleteOrganization, INITIAL);
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-coral/30 bg-coral/5 p-5">
      <p className="text-sm font-medium text-ink">Eliminar organización</p>
      <p className="text-xs text-muted">
        Solo si no tiene proyectos. Esta acción no se puede deshacer.
      </p>

      <div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={buttonClasses({ variant: "secondary", size: "sm" })}
        >
          Eliminar organización
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="¿Eliminar esta organización?">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink">
            Solo se puede si no tiene proyectos. Esta acción no se puede
            deshacer.
          </p>

          {state.error && (
            <p role="alert" className="text-sm text-coral">
              {state.error}
            </p>
          )}

          <form action={formAction} className="flex justify-end gap-2">
            <input type="hidden" name="orgId" value={orgId} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              Cancelar
            </button>
            <Button type="submit" variant="danger" size="sm">
              Sí, eliminar
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
}
