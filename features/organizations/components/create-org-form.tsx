"use client";

import { useActionState } from "react";
import {
  createOrganization,
  type CreateOrgState,
} from "@/features/organizations/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/features/auth/components/submit-button";

const INITIAL: CreateOrgState = {};

const TIPOS = [
  { valor: "academica", label: "Académica" },
  { valor: "social", label: "Social" },
  { valor: "emprendimiento", label: "Emprendimiento" },
  { valor: "empresa", label: "Empresa" },
  { valor: "interna", label: "Interna" },
] as const;

export function CreateOrgForm() {
  const [state, formAction] = useActionState(createOrganization, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Nombre</span>
        <Input name="nombre" required placeholder="Nombre de la organización" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Tipo</span>
        <select
          name="tipo"
          required
          defaultValue=""
          className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-ink focus-visible:border-electric focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-electric/30"
        >
          <option value="" disabled>
            Selecciona un tipo
          </option>
          {TIPOS.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">
          Descripción <span className="text-muted">(opcional)</span>
        </span>
        <Textarea
          name="descripcion"
          placeholder="Qué hace la organización, a quién sirve…"
          className="min-h-20"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">
          Sitio web <span className="text-muted">(opcional)</span>
        </span>
        <Input
          type="url"
          name="sitio_web"
          placeholder="https://tuorganizacion.cl"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">
          Contacto <span className="text-muted">(opcional)</span>
        </span>
        <Input
          name="contacto"
          placeholder="Persona o correo de referencia"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Creando…">Crear organización</SubmitButton>
    </form>
  );
}
