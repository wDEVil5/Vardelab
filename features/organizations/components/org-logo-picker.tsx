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
      <form ref={formRef} action={formAction}>
        <input type="hidden" name="orgId" value={orgId} />
        <input
          ref={inputRef}
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={() => formRef.current?.requestSubmit()}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          aria-label="Cambiar logo"
          className="group relative disabled:opacity-60"
        >
          <OrgLogo logoUrl={logoUrl} nombre={nombre} size="lg" />
          <span className="absolute inset-0 hidden items-center justify-center rounded-lg bg-ink/50 text-[10px] font-medium text-white group-hover:flex">
            {pending ? "Subiendo…" : "Cambiar"}
          </span>
        </button>
      </form>
      {state.error && (
        <p role="alert" className="max-w-16 text-center text-[10px] text-coral">
          {state.error}
        </p>
      )}
    </div>
  );
}
