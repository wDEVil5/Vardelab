"use client";

import { useActionState, useRef } from "react";
import { OrgLogo } from "@/components/ui/org-logo";
import { uploadOrgLogo, type OrgLogoState } from "@/features/organizations/actions";

const INITIAL: OrgLogoState = {};

/**
 * Logo de la organización (S-01): mismo patrón que `AvatarPicker` (M25) — clic
 * para elegir archivo, se envía solo, overlay al pasar el mouse. Sin modal ni
 * catálogo de presets porque acá no aplican (no hay "logos genéricos" como sí
 * hay avatares de perfil).
 */
export function OrgLogoPicker({
  orgId,
  logoUrl,
  nombre,
}: {
  orgId: string;
  logoUrl: string | null;
  nombre: string;
}) {
  const [state, formAction, pending] = useActionState(uploadOrgLogo, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-1.5">
      <form ref={formRef} action={formAction} className="relative inline-flex w-fit">
        <input type="hidden" name="orgId" value={orgId} />
        <input
          ref={inputRef}
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={() => formRef.current?.requestSubmit()}
        />
        <OrgLogo logoUrl={logoUrl} nombre={nombre} size="lg" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="absolute inset-x-0 bottom-0 rounded-b-lg bg-ink/60 py-1 text-[10px] font-medium text-white transition-colors hover:bg-ink/70 disabled:opacity-60"
        >
          {pending ? "…" : "Cambiar"}
        </button>
      </form>
      {state.error && (
        <p role="alert" className="text-xs text-coral">
          {state.error}
        </p>
      )}
    </div>
  );
}
