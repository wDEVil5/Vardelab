"use client";

import { useActionState, useState } from "react";
import {
  deleteOrganization,
  type DeleteOrgState,
} from "@/features/organizations/actions";
import { Button, buttonClasses } from "@/components/ui/button";

const INITIAL: DeleteOrgState = {};

/**
 * Botón de eliminación de organización con confirmación en dos pasos. Muestra el
 * error de la guarda del servidor (sin proyectos) si aplica.
 */
export function DeleteOrgButton({ orgId }: { orgId: string }) {
  const [state, formAction] = useActionState(deleteOrganization, INITIAL);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-coral/30 bg-coral/5 p-5">
      <p className="text-sm font-medium text-ink">Eliminar organización</p>
      <p className="text-xs text-muted">
        Solo si no tiene proyectos. Esta acción no se puede deshacer.
      </p>

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      {confirming ? (
        <form action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="orgId" value={orgId} />
          <Button type="submit" variant="danger" size="sm">
            Sí, eliminar
          </Button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className={buttonClasses({ variant: "ghost", size: "sm" })}
          >
            Cancelar
          </button>
        </form>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            Eliminar organización
          </button>
        </div>
      )}
    </div>
  );
}
