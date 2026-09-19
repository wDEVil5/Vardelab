"use client";

import { useActionState } from "react";
import { updateSponsorProfile, type ProfileState } from "@/features/profile/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/features/auth/components/submit-button";
import type { ProfileLinks } from "@/features/profile/queries";
import { PerfilIconSvg } from "@/features/profile/components/profile-icons";

const INITIAL: ProfileState = {};

/** Igual que `ProfileForm`, pero solo con los campos que le aplican a un
 * patrocinador: nombre, cargo, bio y enlaces (sin github, ese es de
 * estudiante). El nombre va acá en vez de un diálogo propio aparte — antes
 * `EditAccountNameDialog` quedaba muy chico para lo que es, un campo más. */
export function SponsorProfileForm({
  nombre,
  cargo,
  bio,
  enlaces,
}: {
  nombre: string;
  cargo: string | null;
  bio: string | null;
  enlaces: ProfileLinks;
}) {
  const [state, formAction] = useActionState(updateSponsorProfile, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Nombre</span>
        <Input name="nombre" required defaultValue={nombre} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <PerfilIconSvg name="cargo" className="size-4 text-muted" />
          Cargo <span className="text-muted">(opcional)</span>
        </span>
        <Input
          name="cargo"
          defaultValue={cargo ?? ""}
          placeholder="Ej: Directora de Innovación, Fundador…"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <PerfilIconSvg name="bio" className="size-4 text-muted" />
          Presentación <span className="text-muted">(opcional)</span>
        </span>
        <Textarea
          name="bio"
          defaultValue={bio ?? ""}
          placeholder="Quién eres y qué hace tu organización, en pocas palabras."
          className="min-h-20"
        />
      </label>

      <fieldset className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium text-ink">
          Enlaces <span className="text-muted">(opcional)</span>
        </legend>
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-sm text-ink">
            <PerfilIconSvg name="linkedin" className="size-4 text-muted" />
            LinkedIn
          </span>
          <Input
            type="url"
            name="linkedin"
            defaultValue={enlaces.linkedin ?? ""}
            placeholder="https://linkedin.com/in/tuusuario"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-sm text-ink">
            <PerfilIconSvg name="sitio" className="size-4 text-muted" />
            Sitio
          </span>
          <Input
            type="url"
            name="sitio"
            defaultValue={enlaces.sitio ?? ""}
            placeholder="https://tusitio.cl"
          />
        </label>
      </fieldset>

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Guardando…">Guardar perfil</SubmitButton>
    </form>
  );
}
