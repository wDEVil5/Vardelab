"use client";

import { useActionState, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { renameCategoria, type CatalogState } from "@/features/admin/actions";
import { Input } from "@/components/ui/input";
import { Button, buttonClasses } from "@/components/ui/button";

const INITIAL: CatalogState = {};
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Renombra una categoría (actualiza el texto en todas las habilidades que la
 * usan de una sola vez). Revela el campo al hacer clic, mismo patrón en dos
 * pasos que `DeleteProjectButton` — sin `window.confirm`. El campo "sale" de
 * donde estaba "Renombrar" (`transformOrigin: left`) en vez de reemplazarlo
 * de golpe.
 *
 * Si el nombre nuevo ya existe como otra categoría, la action responde con
 * `requiereConfirmacion` en vez de aplicar el cambio de una: acá se guarda ese
 * nombre pendiente y se cambia "Guardar" por "Confirmar fusión", que reenvía
 * el mismo formulario con `confirmarFusion=true`.
 */
export function RenameCategoryButton({ categoria }: { categoria: string }) {
  const [state, formAction] = useActionState(renameCategoria, INITIAL);
  const [editando, setEditando] = useState(false);
  const reduceMotion = useReducedMotion();

  const confirmandoFusion = state.requiereConfirmacion === true;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {editando ? (
        <motion.form
          key="editar"
          action={formAction}
          initial={reduceMotion ? false : { opacity: 0, scaleX: 0.5, x: -12 }}
          animate={{ opacity: 1, scaleX: 1, x: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, scaleX: 0.5, x: -12 }}
          transition={{ duration: 0.2, ease: EASE }}
          style={{ transformOrigin: "left center" }}
          className="flex flex-col items-end gap-1.5"
        >
          <div className="flex items-center gap-2">
            <input type="hidden" name="categoriaActual" value={categoria} />
            <input
              type="hidden"
              name="confirmarFusion"
              value={String(confirmandoFusion)}
            />
            <Input
              name="categoriaNueva"
              defaultValue={categoria}
              maxLength={40}
              aria-label={`Nuevo nombre para la categoría ${categoria}`}
              className="h-9 w-40"
              autoFocus
            />
            <Button
              type="submit"
              size="sm"
              variant={confirmandoFusion ? "danger" : "primary"}
            >
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
        </motion.form>
      ) : (
        <motion.button
          key="trigger"
          type="button"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.12 }}
          onClick={() => setEditando(true)}
          className="text-sm font-medium text-electric hover:underline"
        >
          Renombrar
        </motion.button>
      )}
    </AnimatePresence>
  );
}
