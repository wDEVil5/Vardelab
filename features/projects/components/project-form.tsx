"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/features/auth/components/submit-button";
import { cn } from "@/lib/utils";
import type { MyOrganization } from "@/features/organizations/queries";
import type { EditableProject } from "@/features/projects/queries";

type ProjectFormState = { error?: string };
type ProjectAction = (
  state: ProjectFormState,
  formData: FormData,
) => Promise<ProjectFormState>;

const INITIAL: ProjectFormState = {};

const MODALIDADES = [
  { valor: "presencial", label: "Presencial" },
  { valor: "remoto", label: "Remoto" },
  { valor: "hibrido", label: "Híbrido" },
] as const;

/**
 * Formulario de proyecto, compartido por el alta y la edición.
 * - Alta: recibe `organizations` y muestra el selector de organización.
 * - Edición: recibe `project`, precarga los campos y agrega `projectId` oculto
 *   (la organización no se cambia tras crear, por eso no aparece el selector).
 *
 * El panel "Checklist de calidad" a la derecha es solo orientativo: no bloquea
 * el envío, ayuda a ver de un vistazo qué falta antes de mandar a revisión.
 */
export function ProjectForm({
  action,
  submitLabel,
  pendingText,
  organizations,
  project,
}: {
  action: ProjectAction;
  submitLabel: string;
  pendingText: string;
  organizations?: MyOrganization[];
  project?: EditableProject;
}) {
  const [state, formAction] = useActionState(action, INITIAL);

  const [problema, setProblema] = useState(project?.problema ?? "");
  const [alcance, setAlcance] = useState(project?.alcance ?? "");
  const [entregable, setEntregable] = useState(project?.entregable ?? "");
  const [datosSeguros, setDatosSeguros] = useState(false);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <form
        action={formAction}
        className="flex flex-col gap-6 rounded-2xl border border-border bg-white p-8 sm:p-10"
      >
        <h2 className="text-lg font-semibold text-ink">Define la necesidad</h2>

        {/* Organización: solo en alta */}
        {organizations && (
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
        )}

        {project && <input type="hidden" name="projectId" value={project.id} />}

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">
            Nombre del proyecto
          </span>
          <Input
            name="titulo"
            required
            defaultValue={project?.titulo ?? ""}
            placeholder="Dashboard de encuesta académica"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">
            Problema que quieres resolver
          </span>
          <Input
            name="problema"
            required
            value={problema}
            onChange={(e) => setProblema(e.target.value)}
            placeholder="Entender la experiencia estudiantil"
          />
        </label>

        <div className="grid gap-6 sm:grid-cols-2">
          <FieldTextarea
            name="alcance"
            label="Alcance"
            placeholder="Flujo principal y entregable verificable."
            value={alcance}
            onChange={setAlcance}
            required
          />
          <FieldTextarea
            name="expectativas"
            label="Expectativas"
            placeholder="Acompañamiento y criterios de éxito claros."
            defaultValue={project?.expectativas ?? ""}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">
              Duración estimada <span className="text-muted">(opcional)</span>
            </span>
            <Input
              type="number"
              name="duracion_semanas"
              min={1}
              max={52}
              defaultValue={project?.duracion_semanas ?? ""}
              placeholder="4 semanas"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">
              Dedicación semanal <span className="text-muted">(opcional)</span>
            </span>
            <Input
              name="dedicacion_semanal"
              maxLength={60}
              defaultValue={project?.dedicacion_semanal ?? ""}
              placeholder="3-4 horas"
            />
          </label>
        </div>

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
                  defaultChecked={
                    project ? project.modalidad === m.valor : i === 1
                  }
                  className="sr-only"
                />
                {m.label}
              </label>
            ))}
          </div>
        </fieldset>

        <FieldTextarea
          name="entregable"
          label="Resultado esperado"
          placeholder="Dashboard responsive con filtros y guía de actualización."
          value={entregable}
          onChange={setEntregable}
          required
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">
            Resumen para el catálogo{" "}
            <span className="text-muted">(opcional)</span>
          </span>
          <Input
            name="resumen"
            defaultValue={project?.resumen ?? ""}
            placeholder="Una línea que vean los estudiantes antes de abrir el proyecto"
          />
        </label>

        <label className="flex items-start gap-2.5 text-sm text-muted">
          <input
            type="checkbox"
            checked={datosSeguros}
            onChange={(e) => setDatosSeguros(e.target.checked)}
            className="mt-0.5 size-4 rounded border-border text-electric focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-electric/30"
          />
          Confirmo que este proyecto no pide datos personales sensibles del
          estudiante (RUT, datos bancarios, etc.).
        </label>

        {state.error && (
          <p role="alert" className="text-sm text-coral">
            {state.error}
          </p>
        )}

        <SubmitButton pendingText={pendingText}>{submitLabel}</SubmitButton>
      </form>

      <ChecklistCalidad
        problemaListo={problema.trim().length > 0}
        alcanceListo={alcance.trim().length > 0}
        entregableListo={entregable.trim().length > 0}
        datosSeguros={datosSeguros}
      />
    </div>
  );
}

// Campo de texto largo reutilizado por los bloques de la plantilla. Acepta
// `value`/`onChange` (controlado, para alimentar el checklist) o `defaultValue`
// (no controlado, para los campos que el checklist no necesita observar).
function FieldTextarea({
  name,
  label,
  placeholder,
  value,
  defaultValue,
  onChange,
  required,
}: {
  name: string;
  label: string;
  placeholder: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">
        {label}
        {!required && <span className="text-muted"> (opcional)</span>}
      </span>
      <Textarea
        name={name}
        required={required}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
      />
    </label>
  );
}

/** Panel orientativo: refleja en vivo qué partes de la plantilla ya están listas. */
function ChecklistCalidad({
  problemaListo,
  alcanceListo,
  entregableListo,
  datosSeguros,
}: {
  problemaListo: boolean;
  alcanceListo: boolean;
  entregableListo: boolean;
  datosSeguros: boolean;
}) {
  const items = [
    { label: "Problema real", listo: problemaListo },
    { label: "Alcance posible", listo: alcanceListo },
    { label: "Entregable verificable", listo: entregableListo },
    { label: "Datos seguros", listo: datosSeguros },
  ];

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-white p-6 lg:sticky lg:top-8">
      <h3 className="text-sm font-semibold text-ink">Checklist de calidad</h3>
      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2.5 text-sm">
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border",
                item.listo
                  ? "border-transparent bg-emerald-500 text-white"
                  : "border-border bg-white",
              )}
            >
              {item.listo && (
                <svg
                  viewBox="0 0 24 24"
                  className="size-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span className={item.listo ? "text-ink" : "text-muted"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
