"use client";

import { useActionState } from "react";
import { toggleSkillActivo, type CatalogState } from "@/features/admin/actions";
import { buttonClasses } from "@/components/ui/button";

const INITIAL: CatalogState = {};

/**
 * Activa/desactiva una habilidad. Sin confirmación en dos pasos: a diferencia
 * de suspender una cuenta, es reversible con el mismo botón al toque
 * siguiente y no borra nada (mismo criterio que el toggle de visibilidad del
 * portafolio).
 */
export function ToggleSkillButton({
  skillId,
  nombre,
  activo,
}: {
  skillId: string;
  nombre: string;
  activo: boolean;
}) {
  const [state, formAction] = useActionState(toggleSkillActivo, INITIAL);

  return (
    <form action={formAction} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="skillId" value={skillId} />
      <input type="hidden" name="nombre" value={nombre} />
      <input type="hidden" name="activo" value={String(!activo)} />
      <button
        type="submit"
        className={buttonClasses({ variant: activo ? "outline-danger" : "outline-primary", size: "sm" })}
      >
        {activo ? "Desactivar" : "Activar"}
      </button>
      {state.error && (
        <p role="alert" className="text-xs text-coral">
          {state.error}
        </p>
      )}
    </form>
  );
}
