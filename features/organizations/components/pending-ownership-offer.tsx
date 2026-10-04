"use client";

import { useActionState } from "react";
import {
  cancelOrganizationOwnershipOffer,
  type OwnershipState,
} from "@/features/organizations/actions";
import { buttonClasses } from "@/components/ui/button";

const INITIAL: OwnershipState = {};

/**
 * Oferta de propiedad que sigue esperando respuesta. Mientras esté pendiente,
 * la propiedad no cambia, y el dueño puede retirarla.
 */
export function PendingOwnershipOffer({
  offerId,
  orgId,
  nombre,
}: {
  offerId: string;
  orgId: string;
  nombre: string;
}) {
  const [state, formAction] = useActionState(cancelOrganizationOwnershipOffer, INITIAL);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-electric/30 bg-electric/5 p-4">
      <p className="text-sm text-ink">
        Esperando que <span className="font-medium">{nombre}</span> acepte la propiedad.
        Hasta entonces, sigues siendo el dueño.
      </p>
      <form action={formAction} className="flex flex-col items-end gap-1">
        <input type="hidden" name="offerId" value={offerId} />
        <input type="hidden" name="orgId" value={orgId} />
        <button type="submit" className={buttonClasses({ variant: "ghost", size: "sm" })}>
          Cancelar oferta
        </button>
        {state.error && (
          <p role="alert" className="text-xs text-coral">
            {state.error}
          </p>
        )}
      </form>
    </div>
  );
}
