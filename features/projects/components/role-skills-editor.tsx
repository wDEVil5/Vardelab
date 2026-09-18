"use client";

import { useActionState, type ReactNode } from "react";
import { deleteRoleSkill, type DeleteRoleSkillState } from "@/features/projects/actions";
import { AddRoleSkillModal } from "@/features/projects/components/add-role-skill-modal";
import type { Skill } from "@/features/skills/queries";
import type { ManagedProject } from "@/features/projects/queries";

const NIVEL_LABEL: Record<string, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

const DELETE_INITIAL: DeleteRoleSkillState = {};

type RoleSkill = ManagedProject["roles"][number]["skills"][number];

/** Chip de una habilidad ya exigida en el rol, con su propio botón de quitar. */
function RoleSkillChip({
  projectId,
  roleId,
  skillId,
  nombre,
  children,
}: {
  projectId: string;
  roleId: string;
  skillId: string;
  nombre: string;
  children?: ReactNode;
}) {
  const [state, formAction] = useActionState(deleteRoleSkill, DELETE_INITIAL);

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span className="inline-flex items-center gap-1 rounded-full bg-electric/10 px-2.5 py-1 text-xs font-medium text-electric">
        {nombre}
        {children}
        <form action={formAction} className="inline">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="roleId" value={roleId} />
          <input type="hidden" name="skillId" value={skillId} />
          <button
            type="submit"
            aria-label={`Quitar ${nombre}`}
            className="ml-0.5 text-electric/60 hover:text-coral"
          >
            ×
          </button>
        </form>
      </span>
      {state.error && (
        <span role="alert" className="text-[11px] text-coral">
          {state.error}
        </span>
      )}
    </span>
  );
}

/**
 * Habilidades exigidas de un rol ya creado: los chips con botón de quitar, y
 * un botón "+" chico que abre el alta en un modal — la tarjeta se mantiene
 * limpia en reposo (elegir las habilidades es lo normal al crear el rol, con
 * `NewRoleSkillsPicker`); esto es para el caso ocasional de sumar una después.
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
  const usados = new Set(
    skills.map((s) => s.skill?.id).filter((id): id is string => Boolean(id)),
  );
  const disponibles = catalog.filter((s) => !usados.has(s.id));

  return (
    <div className="mt-6 flex flex-col gap-4 border-t border-border pt-6">
      <div className="flex flex-col items-start gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Habilidades requeridas
        </span>
        <AddRoleSkillModal projectId={projectId} roleId={roleId} disponibles={disponibles} />
      </div>

      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <RoleSkillChip
              key={s.skill?.id ?? s.nivel_minimo}
              projectId={projectId}
              roleId={roleId}
              skillId={s.skill?.id ?? ""}
              nombre={s.skill?.nombre ?? ""}
            >
              {s.nivel_minimo && (
                <span className="font-normal text-electric/70">
                  · {NIVEL_LABEL[s.nivel_minimo] ?? s.nivel_minimo}
                </span>
              )}
            </RoleSkillChip>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">No se pidieron habilidades para este rol.</p>
      )}
    </div>
  );
}
