"use client";

import { useActionState } from "react";
import {
  acceptOrganizationInvitation,
  declineOrganizationInvitation,
  type InvitationResponseState,
} from "@/features/organizations/actions";
import { buttonClasses } from "@/components/ui/button";

const INITIAL: InvitationResponseState = {};

/**
 * Aceptar o rechazar una invitación. Son acciones reversibles desde la misma
 * pantalla (rechazar no quita nada que ya tuvieras), así que no piden
 * confirmación en dos pasos.
 */
export function InvitationActions({ memberId }: { memberId: string }) {
  const [acceptState, acceptAction] = useActionState(acceptOrganizationInvitation, INITIAL);
  const [declineState, declineAction] = useActionState(declineOrganizationInvitation, INITIAL);
  const error = acceptState.error || declineState.error;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <form action={declineAction}>
          <input type="hidden" name="memberId" value={memberId} />
          <button type="submit" className={`${buttonClasses({ variant: "ghost", size: "sm" })} min-h-11`}>
            Rechazar
          </button>
        </form>
        <form action={acceptAction}>
          <input type="hidden" name="memberId" value={memberId} />
          <button type="submit" className={`${buttonClasses({ variant: "primary", size: "sm" })} min-h-11`}>
            Aceptar
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
