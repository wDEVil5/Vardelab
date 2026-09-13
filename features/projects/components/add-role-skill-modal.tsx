"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { addRoleSkill, type AddRoleSkillState } from "@/features/projects/actions";
import type { Skill } from "@/features/skills/queries";

const INITIAL: AddRoleSkillState = {};

/**
 * Botón "+" para agregar una habilidad a un rol YA creado (a diferencia de
 * `NewRoleSkillsPicker`, que es para elegirlas al crear el rol). Vive en un
 * modal chico en vez de un formulario permanente en la tarjeta: se necesita
 * ocasionalmente (agregar algo que se olvidó, o que el alcance cambió), no
 * todo el tiempo — la tarjeta se mantiene limpia en reposo.
 */
export function AddRoleSkillModal({
  projectId,
  roleId,
  disponibles,
}: {
  projectId: string;
  roleId: string;
  disponibles: Skill[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(addRoleSkill, INITIAL);

  if (disponibles.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Agregar habilidad"
        className="group flex h-7 shrink-0 items-center overflow-hidden rounded-full border border-electric text-electric transition-colors hover:bg-electric/5"
      >
        <span className="flex size-7 shrink-0 items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-medium opacity-0 transition-all duration-300 ease-out group-hover:max-w-32 group-hover:pr-3 group-hover:opacity-100">
          Agregar habilidad
        </span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Agregar habilidad">
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="roleId" value={roleId} />

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Habilidad</span>
            <Select name="skillId" required defaultValue="">
              <option value="" disabled>
                Selecciona una habilidad
              </option>
              {disponibles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </Select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Nivel mínimo</span>
            <Select name="nivel" defaultValue="basico">
              <option value="basico">Básico</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </Select>
          </label>

          {state.error && (
            <p role="alert" className="text-sm text-coral">
              {state.error}
            </p>
          )}

          <SubmitButton pendingText="Agregando…">Agregar</SubmitButton>
        </form>
      </Modal>
    </>
  );
}
