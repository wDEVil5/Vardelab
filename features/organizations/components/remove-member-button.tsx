"use client";

import { useActionState } from "react";
import { removeOrganizationMember, type RemoveMemberState } from "@/features/organizations/actions";
import { buttonClasses } from "@/components/ui/button";

const INITIAL: RemoveMemberState = {};

/** Botón "Quitar" con su propio estado de error — antes fallaba en silencio. */
export function RemoveMemberButton({ memberId, orgId }: { memberId: string; orgId: string }) {
  const [state, formAction] = useActionState(removeOrganizationMember, INITIAL);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="orgId" value={orgId} />
      <button type="submit" className={buttonClasses({ variant: "ghost", size: "sm" })}>
        Quitar
      </button>
      {state.error && (
        <p role="alert" className="text-xs text-coral">
          {state.error}
        </p>
      )}
    </form>
  );
}
