"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/features/profile/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/features/auth/components/submit-button";
import type { MyProfile, ProfileLinks } from "@/features/profile/queries";

const INITIAL: ProfileState = {};

export function ProfileForm({ profile }: { profile: MyProfile }) {
  const [state, formAction] = useActionState(updateProfile, INITIAL);
  const links = (profile.enlaces ?? {}) as ProfileLinks;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Nombre</span>
        <Input name="nombre" required defaultValue={profile.nombre ?? ""} />
      </label>

      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">
            Carrera <span className="text-muted">(opcional)</span>
          </span>
          <Input
            name="carrera"
            defaultValue={profile.carrera ?? ""}
            placeholder="Ej: Ingeniería en Computación"
          />
        </label>
        <label className="flex flex-col gap-1.5 sm:w-32">
          <span className="text-sm font-medium text-ink">
            Semestre <span className="text-muted">(opc.)</span>
          </span>
          <Input
            type="number"
            name="semestre"
            min={1}
            max={14}
            defaultValue={profile.semestre ?? ""}
            placeholder="Ej: 6"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">
          Sobre ti <span className="text-muted">(opcional)</span>
        </span>
        <Textarea
          name="bio"
          defaultValue={profile.bio ?? ""}
          placeholder="Una breve presentación: qué te interesa, qué buscas."
          className="min-h-20"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">
          Intereses <span className="text-muted">(opcional)</span>
        </span>
        <Input
          name="intereses"
          defaultValue={profile.intereses ?? ""}
          placeholder="Ej: frontend, datos, diseño"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">
          Disponibilidad <span className="text-muted">(opcional)</span>
        </span>
        <Input
          name="disponibilidad"
          defaultValue={profile.disponibilidad ?? ""}
          placeholder="Ej: 10 horas semanales, tardes"
        />
      </label>

      {/* Enlaces */}
      <fieldset className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium text-ink">
          Enlaces <span className="text-muted">(opcional)</span>
        </legend>
        <Input
          type="url"
          name="github"
          defaultValue={links.github ?? ""}
          placeholder="https://github.com/tuusuario"
        />
        <Input
          type="url"
          name="linkedin"
          defaultValue={links.linkedin ?? ""}
          placeholder="https://linkedin.com/in/tuusuario"
        />
        <Input
          type="url"
          name="sitio"
          defaultValue={links.sitio ?? ""}
          placeholder="https://tusitio.cl (portafolio, blog…)"
        />
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
