"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  inviteOrganizationMember,
  type InviteMemberState,
} from "@/features/organizations/actions";
import { INVITACIONES_HABILITADAS } from "@/features/organizations/config";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

const INITIAL: InviteMemberState = {};

/**
 * Invita a alguien por correo a co-gestionar la organización (M37/M38). El
 * input y el botón quedan deshabilitados mientras `INVITACIONES_HABILITADAS`
 * sea `false` — la barrera real está en la Server Action (esto es para que
 * además se vea y se sienta deshabilitado, no solo rechazado en silencio).
 */
export function InviteMemberForm({ orgId }: { orgId: string }) {
  const [state, formAction] = useActionState(inviteOrganizationMember, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  // `state.ok` solo es verdadero tras un envío real (el estado inicial no lo
  // trae) — no hace falta una ref "ya hubo un envío" para no confundir el
  // montaje con un envío real; esa ref se rompe con el doble-invocado de
  // efectos de React Strict Mode en desarrollo.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
    >
      <input type="hidden" name="orgId" value={orgId} />
      <div className="flex-1">
        <Input
          type="email"
          name="email"
          required
          disabled={!INVITACIONES_HABILITADAS}
          placeholder="correo@ejemplo.cl"
        />
        {!INVITACIONES_HABILITADAS && (
          <p className="mt-1.5 text-xs text-muted">
            Todavía no está disponible.
          </p>
        )}
        {state.error && (
          <p role="alert" className="mt-1.5 text-xs text-coral">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="mt-1.5 text-xs text-sprout">Invitación enviada.</p>
        )}
      </div>
      <SubmitButton
        pendingText="Invitando…"
        className="shrink-0"
        disabled={!INVITACIONES_HABILITADAS}
      >
        Invitar
      </SubmitButton>
    </form>
  );
}
