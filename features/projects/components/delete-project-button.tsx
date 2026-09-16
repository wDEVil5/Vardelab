"use client";

import { useActionState, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  deleteProject,
  type DeleteProjectState,
} from "@/features/projects/actions";
import { Button, buttonClasses } from "@/components/ui/button";

const INITIAL: DeleteProjectState = {};
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Botón de eliminación con confirmación en dos pasos (sin `confirm()` del
 * navegador): el primer click revela "¿Seguro?" con confirmar/cancelar. Muestra
 * el error de las guardas del servidor (borrador / sin postulaciones) si aplica.
 *
 * El confirm "sale" de donde estaba el botón disparador (`transformOrigin:
 * left`: acá el trigger es de ancho completo, no un ícono a la derecha como
 * en `RemoveTeamMemberButton`, así que crece desde la izquierda) en vez de
 * reemplazarlo de golpe.
 */
export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [state, formAction] = useActionState(deleteProject, INITIAL);
  const [confirming, setConfirming] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-coral/30 bg-coral/5 p-5">
      <p className="text-sm font-medium text-ink">Eliminar proyecto</p>
      <p className="text-xs text-muted">
        Solo si está en borrador y sin postulaciones. Esta acción no se puede
        deshacer.
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
            <input type="hidden" name="projectId" value={projectId} />
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
              Eliminar proyecto
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
