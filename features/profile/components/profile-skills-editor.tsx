"use client";

import { useActionState } from "react";
import {
  addProfileSkill,
  deleteProfileSkill,
  type AddSkillState,
} from "@/features/profile/actions";
import type { Skill } from "@/features/skills/queries";
import type { MyProfileSkill } from "@/features/profile/queries";

const INITIAL: AddSkillState = {};

const NIVEL_LABEL: Record<string, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

/**
 * Editor de las habilidades del perfil: chips con opción de quitar, y un
 * formulario para agregar (habilidad del catálogo + nivel). Filtra del selector
 * las ya declaradas.
 */
export function ProfileSkillsEditor({
  skills,
  catalog,
}: {
  skills: MyProfileSkill[];
  catalog: Skill[];
}) {
  const [state, formAction] = useActionState(addProfileSkill, INITIAL);

  const usados = new Set(
    skills.map((s) => s.skill?.id).filter((id): id is string => Boolean(id)),
  );
  const disponibles = catalog.filter((s) => !usados.has(s.id));

  return (
    <div className="flex flex-col gap-3">
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span
              key={s.skill?.id ?? s.skill_id}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted"
            >
              {s.skill?.nombre}
              {s.nivel && (
                <span className="text-muted/70">
                  · {NIVEL_LABEL[s.nivel] ?? s.nivel}
                </span>
              )}
              <form action={deleteProfileSkill} className="inline">
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

      {disponibles.length > 0 && (
        <form action={formAction} className="flex flex-wrap items-center gap-2">
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
