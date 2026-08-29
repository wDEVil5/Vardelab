"use client";

import { useActionState } from "react";
import {
  createProject,
  type CreateProjectState,
} from "@/features/projects/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/features/auth/components/submit-button";
import type { MyOrganization } from "@/features/organizations/queries";

const INITIAL: CreateProjectState = {};

const MODALIDADES = [
  { valor: "presencial", label: "Presencial" },
  { valor: "remoto", label: "Remoto" },
  { valor: "hibrido", label: "Híbrido" },
] as const;

/**
 * Formulario de creación de proyecto (plantilla obligatoria). Recibe las
 * organizaciones del patrocinador para elegir bajo cuál se crea. Si tiene una
 * sola, el select queda con esa opción fija.
 */
export function CreateProjectForm({
  organizations,
}: {
  organizations: MyOrganization[];
}) {
  const [state, formAction] = useActionState(createProject, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* Organización */}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Organización</span>
        {organizations.length === 1 ? (
          <>
            <input type="hidden" name="orgId" value={organizations[0].id} />
            <Input value={organizations[0].nombre} disabled readOnly />
          </>
        ) : (
          <select
            name="orgId"
            required
            defaultValue=""
            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-ink focus-visible:border-electric focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-electric/30"
          >
            <option value="" disabled>
              Selecciona una organización
            </option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </select>
        )}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Título</span>
        <Input name="titulo" required placeholder="Nombre breve del proyecto" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">
          Resumen <span className="text-muted">(opcional)</span>
        </span>
        <Input
          name="resumen"
          placeholder="Una línea que describa el proyecto"
        />
      </label>

      <FieldTextarea
        name="problema"
        label="El problema"
        placeholder="¿Qué necesidad real resuelve este proyecto?"
        required
      />
      <FieldTextarea
        name="alcance"
        label="Alcance"
        placeholder="Qué incluye y qué no. Mantenlo acotado."
        required
      />
      <FieldTextarea
        name="entregable"
        label="Entregable"
        placeholder="Qué resultado concreto se entrega al final."
        required
      />
      <FieldTextarea
        name="expectativas"
        label="Expectativas"
        placeholder="Dedicación, forma de trabajo, reuniones… (opcional)"
      />

      {/* Modalidad */}
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-medium text-ink">
          Modalidad
        </legend>
        <div className="grid grid-cols-3 gap-3">
          {MODALIDADES.map((m, i) => (
            <label
              key={m.valor}
              className="flex cursor-pointer items-center justify-center rounded-md border border-border p-2.5 text-sm text-ink transition-colors has-[:checked]:border-electric has-[:checked]:bg-electric/5"
            >
              <input
                type="radio"
                name="modalidad"
                value={m.valor}
                defaultChecked={i === 1}
                className="sr-only"
              />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">
          Duración en semanas <span className="text-muted">(opcional)</span>
        </span>
        <Input
          type="number"
          name="duracion_semanas"
          min={1}
          max={52}
          placeholder="Ej: 4"
          className="max-w-32"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Creando…">Crear proyecto</SubmitButton>
    </form>
  );
}

// Campo de texto largo reutilizado por los bloques de la plantilla.
function FieldTextarea({
  name,
  label,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">
        {label}
        {!required && <span className="text-muted"> (opcional)</span>}
      </span>
      <Textarea name={name} required={required} placeholder={placeholder} />
    </label>
  );
}
