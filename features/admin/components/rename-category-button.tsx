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

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <input type="hidden" name="categoriaActual" value={categoria} />
        <Input
          name="categoriaNueva"
          defaultValue={categoria}
          maxLength={40}
          aria-label={`Nuevo nombre para la categoría ${categoria}`}
          className="h-9 w-40"
          autoFocus
        />
        <Button type="submit" size="sm">
          Guardar
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
