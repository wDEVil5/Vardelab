"use client";

import { useActionState } from "react";
import {
  acceptOrganizationOwnership,
  declineOrganizationOwnership,
  type OwnershipState,
} from "@/features/organizations/actions";
import { buttonClasses } from "@/components/ui/button";

const INITIAL: OwnershipState = {};

/**
 * Aceptar o rechazar una oferta de propiedad. Aceptar cambia quién es el dueño
 * de la organización, así que la tarjeta que lo contiene explica qué implica
 * antes de que se pueda hacer clic.
 */
export function OwnershipOfferActions({ offerId }: { offerId: string }) {
  const [acceptState, acceptAction] = useActionState(acceptOrganizationOwnership, INITIAL);
  const [declineState, declineAction] = useActionState(declineOrganizationOwnership, INITIAL);
  const error = acceptState.error || declineState.error;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <form action={declineAction}>
          <input type="hidden" name="offerId" value={offerId} />
          <button type="submit" className={`${buttonClasses({ variant: "ghost", size: "sm" })} min-h-11`}>
            Rechazar
          </button>
        </form>
        <form action={acceptAction}>
          <input type="hidden" name="offerId" value={offerId} />
          <button type="submit" className={`${buttonClasses({ variant: "primary", size: "sm" })} min-h-11`}>
            Aceptar propiedad
          </button>
        </form>
      </div>
      {error && (
        <p role="alert" className="text-xs text-coral">
          {error}
        </p>
      )}
    </div>
  );
}
