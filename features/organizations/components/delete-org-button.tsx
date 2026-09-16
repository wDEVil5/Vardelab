"use client";

import { useActionState, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  deleteOrganization,
  type DeleteOrgState,
} from "@/features/organizations/actions";
import { Button, buttonClasses } from "@/components/ui/button";

const INITIAL: DeleteOrgState = {};
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Botón de eliminación de organización con confirmación en dos pasos. Muestra el
 * error de la guarda del servidor (sin proyectos) si aplica.
 *
 * El confirm "sale" de donde estaba el botón disparador (`transformOrigin:
 * left`, mismo criterio que `DeleteProjectButton`) en vez de reemplazarlo
 * de golpe.
 */
export function DeleteOrgButton({ orgId }: { orgId: string }) {
  const [state, formAction] = useActionState(deleteOrganization, INITIAL);
  const [confirming, setConfirming] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-coral/30 bg-coral/5 p-5">
      <p className="text-sm font-medium text-ink">Eliminar organización</p>
      <p className="text-xs text-muted">
        Solo si no tiene proyectos. Esta acción no se puede deshacer.
      </p>

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {confirming ? (
          <motion.form
            key="confirm"
            action={formAction}
            initial={reduceMotion ? false : { opacity: 0, scaleX: 0.5, x: -12 }}
            animate={{ opacity: 1, scaleX: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scaleX: 0.5, x: -12 }}
            transition={{ duration: 0.2, ease: EASE }}
            style={{ transformOrigin: "left center" }}
            className="flex items-center gap-2"
          >
            <input type="hidden" name="orgId" value={orgId} />
            <Button type="submit" variant="danger" size="sm">
              Sí, eliminar
            </Button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              Cancelar
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="trigger"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              Eliminar organización
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
