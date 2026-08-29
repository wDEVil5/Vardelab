"use client";

import { useActionState } from "react";
import {
  addRoleSkill,
  deleteRoleSkill,
  type AddRoleSkillState,
} from "@/features/projects/actions";
import type { Skill } from "@/features/skills/queries";
import type { ManagedProject } from "@/features/projects/queries";

const INITIAL: AddRoleSkillState = {};

const NIVEL_LABEL: Record<string, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

type RoleSkill = ManagedProject["roles"][number]["skills"][number];

/**
 * Edita las habilidades exigidas de un rol: muestra las actuales como chips con
 * botón de quitar, y un formulario para agregar (habilidad del catálogo +
 * nivel). Filtra del selector las habilidades ya asignadas.
 */
export function RoleSkillsEditor({
  projectId,
  roleId,
  skills,
  catalog,
}: {
  projectId: string;
  roleId: string;
  skills: RoleSkill[];
  catalog: Skill[];
}) {
  const [state, formAction] = useActionState(addRoleSkill, INITIAL);

  const usados = new Set(
    skills.map((s) => s.skill?.id).filter((id): id is string => Boolean(id)),
  );
  const disponibles = catalog.filter((s) => !usados.has(s.id));

  return (
    <div className="mt-1 flex flex-col gap-2">
      {/* Habilidades actuales */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span
              key={s.skill?.id ?? s.nivel_minimo}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted"
            >
              {s.skill?.nombre}
              {s.nivel_minimo && (
                <span className="text-muted/70">
                  · {NIVEL_LABEL[s.nivel_minimo] ?? s.nivel_minimo}
                </span>
              )}
              <form action={deleteRoleSkill} className="inline">
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="roleId" value={roleId} />
                <input type="hidden" name="skillId" value={s.skill?.id ?? ""} />
                <button
                  type="submit"
                  aria-label={`Quitar ${s.skill?.nombre}`}
                  className="ml-0.5 text-muted/60 hover:text-coral"
                >
                  ×
                </button>
              </form>
            </span>
          ))}
        </div>
      )}

      {/* Agregar habilidad */}
      {disponibles.length > 0 && (
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="roleId" value={roleId} />
          <select
            name="skillId"
            required
            defaultValue=""
            className="h-8 rounded-md border border-border bg-white px-2 text-xs text-ink focus-visible:border-electric focus-visible:outline-none"
          >
            <option value="" disabled>
              Habilidad…
            </option>
            {disponibles.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
          <select
            name="nivel"
            defaultValue="basico"
            className="h-8 rounded-md border border-border bg-white px-2 text-xs text-ink focus-visible:border-electric focus-visible:outline-none"
          >
            <option value="basico">Básico</option>
            <option value="intermedio">Intermedio</option>
            <option value="avanzado">Avanzado</option>
          </select>
          <button
            type="submit"
            className="h-8 rounded-md px-2 text-xs font-medium text-electric hover:bg-electric/10"
          >
            + Agregar
          </button>
          {state.error && (
            <span role="alert" className="text-xs text-coral">
              {state.error}
            </span>
          )}
        </form>
      )}
    </div>
  );
}
