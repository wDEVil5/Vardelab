"use client";

import { useActionState } from "react";
import {
  offerOrganizationOwnership,
  type OwnershipState,
} from "@/features/organizations/actions";
import { buttonClasses } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const INITIAL: OwnershipState = {};

/**
 * Vía de rescate del admin para una organización sin dueño activo: ofrece la
 * propiedad a un miembro activo. Igual que el dueño, la oferta exige que la
 * persona la acepte (M111); el admin no la transfiere por su cuenta.
 */
export function AdminOwnershipOfferForm({
  orgId,
  miembros,
}: {
  orgId: string;
  miembros: { userId: string; etiqueta: string }[];
}) {
  const [state, formAction] = useActionState(offerOrganizationOwnership, INITIAL);

  if (miembros.length === 0) {
    return (
      <p className="text-sm text-muted">
        No hay miembros activos a quien ofrecerle la propiedad.
      </p>
    );
  }

  return (
    <form action={formAction} className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <input type="hidden" name="orgId" value={orgId} />
      <label className="flex min-w-0 flex-col gap-1.5 text-sm">
        <span className="whitespace-nowrap font-medium text-ink">Miembro activo</span>
        <Select
          name="newOwnerId"
          uiSize="sm"
          required
          defaultValue=""
          className="min-w-0"
        >
          <option value="" disabled>
            Elige a quién ofrecer la propiedad
          </option>
          {miembros.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.etiqueta}
            </option>
          ))}
        </Select>
      </label>
      <button
        type="submit"
        className={`${buttonClasses({ variant: "primary", size: "sm" })} shrink-0 whitespace-nowrap`}
      >
        Ofrecer propiedad
      </button>
      {state.error && (
        <p role="alert" className="text-xs text-coral sm:col-span-2">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-xs text-sprout sm:col-span-2">
          Oferta enviada. La propiedad cambia cuando la persona la acepte.
        </p>
      )}
    </form>
  );
}
