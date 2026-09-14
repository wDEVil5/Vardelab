"use client";

import { useActionState, useState } from "react";
import { renameCategoria, type CatalogState } from "@/features/admin/actions";
import { Input } from "@/components/ui/input";
import { Button, buttonClasses } from "@/components/ui/button";

const INITIAL: CatalogState = {};

/**
 * Renombra una categoría (actualiza el texto en todas las habilidades que la
 * usan de una sola vez). Revela el campo al hacer clic, mismo patrón en dos
 * pasos que `DeleteProjectButton` — sin `window.confirm`.
 *
 * Si el nombre nuevo ya existe como otra categoría, la action responde con
 * `requiereConfirmacion` en vez de aplicar el cambio de una: acá se guarda ese
 * nombre pendiente y se cambia "Guardar" por "Confirmar fusión", que reenvía
 * el mismo formulario con `confirmarFusion=true`.
 */
export function RenameCategoryButton({ categoria }: { categoria: string }) {
  const [state, formAction] = useActionState(renameCategoria, INITIAL);
  const [editando, setEditando] = useState(false);

  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="text-sm font-medium text-electric hover:underline"
      >
        Renombrar
      </button>
    );
  }

  const confirmandoFusion = state.requiereConfirmacion === true;

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <input type="hidden" name="categoriaActual" value={categoria} />
        <input type="hidden" name="confirmarFusion" value={String(confirmandoFusion)} />
        <Input
          name="categoriaNueva"
          defaultValue={categoria}
          maxLength={40}
          aria-label={`Nuevo nombre para la categoría ${categoria}`}
          className="h-9 w-40"
          autoFocus
        />
        <Button type="submit" size="sm" variant={confirmandoFusion ? "danger" : "primary"}>
          {confirmandoFusion ? "Confirmar fusión" : "Guardar"}
        </Button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className={buttonClasses({ variant: "ghost", size: "sm" })}
        >
          Cancelar
        </button>
      </div>
      {state.error && (
        <p role="alert" className="text-xs text-coral">
          {state.error}
        </p>
      )}
    </form>
  );
}
