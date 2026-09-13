"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/features/auth/components/submit-button";
import type { EditableOrganization } from "@/features/organizations/queries";

// Estado compartido por crear y editar (ambas acciones devuelven { error? }).
type OrgFormState = { error?: string };
type OrgAction = (
  state: OrgFormState,
  formData: FormData,
) => Promise<OrgFormState>;

const INITIAL: OrgFormState = {};

const TIPOS = [
  { valor: "academica", label: "Académica" },
  { valor: "social", label: "Social" },
  { valor: "emprendimiento", label: "Emprendimiento" },
  { valor: "empresa", label: "Empresa" },
  { valor: "interna", label: "Interna" },
] as const;

/**
 * Formulario de organización, compartido por el alta y la edición. Si recibe
 * `org` precarga los valores y agrega el campo oculto `orgId` (modo edición).
 */
export function OrgForm({
  action,
  submitLabel,
  pendingText,
  org,
}: {
  action: OrgAction;
  submitLabel: string;
  pendingText: string;
  org?: EditableOrganization;
}) {
  const [state, formAction] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {org && <input type="hidden" name="orgId" value={org.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Nombre público</span>
          <Input
            name="nombre"
            required
            defaultValue={org?.nombre ?? ""}
            placeholder="Nombre de la organización"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">
            Sitio web <span className="text-muted">(opcional)</span>
          </span>
          <Input
            type="url"
            name="sitio_web"
            defaultValue={org?.sitio_web ?? ""}
            placeholder="https://tuorganizacion.cl"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Tipo de organización</span>
        <Select name="tipo" required defaultValue={org?.tipo ?? ""}>
          <option value="" disabled>
            Selecciona un tipo
          </option>
          {TIPOS.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.label}
            </option>
          ))}
        </Select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">
          Descripción breve <span className="text-muted">(opcional)</span>
        </span>
        <Textarea
          name="descripcion"
          defaultValue={org?.descripcion ?? ""}
          placeholder="Qué hace la organización, a quién sirve…"
          className="min-h-20"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">
            Persona de contacto <span className="text-muted">(opcional)</span>
          </span>
          <Input
            name="contacto"
            defaultValue={org?.contacto ?? ""}
            placeholder="Nombre de referencia"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">
            Correo de contacto <span className="text-muted">(opcional)</span>
          </span>
          <Input
            type="email"
            name="contacto_email"
            defaultValue={org?.contacto_email ?? ""}
            placeholder="contacto@organizacion.cl"
          />
        </label>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText={pendingText}>{submitLabel}</SubmitButton>
    </form>
  );
}
