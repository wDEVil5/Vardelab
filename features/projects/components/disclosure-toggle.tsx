"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { setProjectDisclosure } from "@/features/projects/actions";

/**
 * Permiso de divulgación (M102/D2): el gestor decide si los integrantes
 * pueden mostrar el nombre/resultado de este proyecto en su portafolio
 * público. Sin esto, `addPortfolioItem`/`togglePortfolioItemVisibility`
 * rechazan publicar cualquier ficha ligada a este proyecto — este switch es
 * la única forma de habilitarlo, no hay aprobación automática.
 */
export function DisclosureToggle({
  projectId,
  autorizado,
}: {
  projectId: string;
  autorizado: boolean;
}) {
  const [checked, setChecked] = useState(autorizado);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function toggle(next: boolean) {
    setChecked(next);
    setError(undefined);
    startTransition(async () => {
      const result = await setProjectDisclosure(projectId, next);
      if (result.error) {
        setChecked(!next);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">Autorizar publicación en portafolios</p>
          <p className="mt-1 text-xs text-muted">
            Permite que el equipo muestre el nombre de este proyecto y su
            resultado en su portafolio público. Sin esto, sus fichas ligadas a
            este proyecto quedan privadas.
          </p>
        </div>
        <Switch
          checked={checked}
          onChange={toggle}
          label="Autorizar publicación en portafolios"
          disabled={pending}
        />
      </div>
      {error && (
        <p role="alert" className="text-xs text-coral">
          {error}
        </p>
      )}
    </div>
  );
}
