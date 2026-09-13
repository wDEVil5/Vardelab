"use client";

import { useId, useState } from "react";
import { Select } from "@/components/ui/select";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Skill } from "@/features/skills/queries";

const NIVEL_LABEL: Record<string, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

type Elegida = { rowId: string; skillId: string; nombre: string; nivel: string };

/**
 * Habilidades exigidas al crear un rol (antes solo se podían agregar en una
 * segunda pasada, una vez creado el rol). Estado puramente local — el rol
 * todavía no existe, así que no hay nada que guardar hasta enviar el
 * formulario completo — codificado como JSON en un campo oculto, mismo patrón
 * que `ObservationsEditor` (M36).
 */
export function NewRoleSkillsPicker({ catalog }: { catalog: Skill[] }) {
  const [elegidas, setElegidas] = useState<Elegida[]>([]);
  const [skillId, setSkillId] = useState("");
  const [nivel, setNivel] = useState("basico");
  const uid = useId();

  const usados = new Set(elegidas.map((e) => e.skillId));
  const disponibles = catalog.filter((s) => !usados.has(s.id));

  const agregar = () => {
    if (!skillId) return;
    const skill = catalog.find((s) => s.id === skillId);
    if (!skill) return;
    setElegidas((prev) => [
      ...prev,
      { rowId: `${uid}-${prev.length}-${Date.now()}`, skillId, nombre: skill.nombre, nivel },
    ]);
    setSkillId("");
  };

  const quitar = (rowId: string) =>
    setElegidas((prev) => prev.filter((e) => e.rowId !== rowId));

  return (
    <div className="flex flex-col gap-2.5">
      <input
        type="hidden"
        name="skills"
        value={JSON.stringify(elegidas.map(({ skillId, nivel }) => ({ skillId, nivel })))}
      />

      {elegidas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {elegidas.map((e) => (
            <span
              key={e.rowId}
              className="inline-flex items-center gap-1 rounded-full bg-electric/10 px-2.5 py-1 text-xs font-medium text-electric"
            >
              {e.nombre}
              <span className="font-normal text-electric/70">
                · {NIVEL_LABEL[e.nivel] ?? e.nivel}
              </span>
              <button
                type="button"
                onClick={() => quitar(e.rowId)}
                aria-label={`Quitar ${e.nombre}`}
                className="ml-0.5 text-electric/60 hover:text-coral"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {disponibles.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
            uiSize="sm"
            className="min-w-24 flex-1"
          >
            <option value="" disabled>
              Habilidad…
            </option>
            {disponibles.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </Select>
          <Select
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
            uiSize="sm"
            className="w-24 shrink-0"
          >
            <option value="basico">Básico</option>
            <option value="intermedio">Intermedio</option>
            <option value="avanzado">Avanzado</option>
          </Select>
          <button
            type="button"
            onClick={agregar}
            disabled={!skillId}
            className={cn(
              buttonClasses({ variant: "outline-primary", size: "sm" }),
              "shrink-0",
            )}
          >
            + Agregar
          </button>
        </div>
      )}
    </div>
  );
}
