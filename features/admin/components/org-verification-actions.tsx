"use client";

import { useActionState } from "react";
import {
  approveOrgVerification,
  rejectOrgVerification,
  type OrgVerificationState,
} from "@/features/admin/actions";
import { Button, buttonClasses } from "@/components/ui/button";

const INITIAL: OrgVerificationState = {};

/**
 * Aprobar/rechazar una solicitud de verificación (M62), solo visible cuando
 * la organización está `en_revision`. Sin confirmación en dos pasos (a
 * diferencia de suspender una cuenta o cancelar un proyecto): es una decisión
 * reversible — el admin puede volver a aprobar o rechazar después si se
 * equivocó, no hay cascada que deshacer.
 */
export function OrgVerificationActions({ orgId }: { orgId: string }) {
  const [approveState, approveAction] = useActionState(approveOrgVerification, INITIAL);
  const [rejectState, rejectAction] = useActionState(rejectOrgVerification, INITIAL);
  const error = approveState.error || rejectState.error;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-electric/20 bg-electric/5 p-7">
      <p className="font-medium text-ink">Solicitud de verificación pendiente</p>
      <p className="text-sm text-muted">
        Revisa los datos de la organización y decide si corresponde otorgarle el sello de verificada.
      </p>
      {error && (
        <p role="alert" className="text-sm text-coral">
          {error}
        </p>
      )}
      <div className="mt-1 flex gap-3">
        <form action={approveAction}>
          <input type="hidden" name="orgId" value={orgId} />
          <Button type="submit" size="sm">
            Aprobar verificación
          </Button>
        </form>
        <form action={rejectAction}>
          <input type="hidden" name="orgId" value={orgId} />
          <button
            type="submit"
            className={buttonClasses({ variant: "outline-danger", size: "sm" })}
          >
            Rechazar
          </button>
        </form>
      </div>
    </div>
  );
}
