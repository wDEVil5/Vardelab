"use client";

import { deleteRoleSkill } from "@/features/projects/actions";
import { AddRoleSkillModal } from "@/features/projects/components/add-role-skill-modal";
import type { Skill } from "@/features/skills/queries";
import type { ManagedProject } from "@/features/projects/queries";

const NIVEL_LABEL: Record<string, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

type RoleSkill = ManagedProject["roles"][number]["skills"][number];

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
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Habilidades requeridas
        </span>
        <AddRoleSkillModal projectId={projectId} roleId={roleId} disponibles={disponibles} />
      </div>

      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span
              key={s.skill?.id ?? s.nivel_minimo}
              className="inline-flex items-center gap-1 rounded-full bg-electric/10 px-2.5 py-1 text-xs font-medium text-electric"
            >
              {s.skill?.nombre}
              {s.nivel_minimo && (
                <span className="font-normal text-electric/70">
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
                  className="ml-0.5 text-electric/60 hover:text-coral"
                >
                  ×
                </button>
              </form>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">No se pidieron habilidades para este rol.</p>
      )}
    </div>
  );
}
