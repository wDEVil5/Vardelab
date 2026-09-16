"use client";

import { useActionState, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  changeUserRole,
  suspendUser,
  reactivateUser,
  type AdminUsersState,
} from "@/features/admin/actions";
import { buttonClasses } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const INITIAL: AdminUsersState = {};
const EASE = [0.22, 1, 0.36, 1] as const;

const ROLES: { value: string; label: string }[] = [
  { value: "estudiante", label: "Estudiante" },
  { value: "patrocinador", label: "Patrocinador" },
  { value: "mentor", label: "Mentor" },
  { value: "moderador", label: "Moderador" },
  { value: "admin", label: "Admin" },
];

/**
 * Acciones de una fila del panel de usuarios: cambiar rol (select + botón, sin
 * confirmación en dos pasos porque no es destructivo y se puede revertir) y
 * suspender/reactivar (confirmación en dos pasos, mismo patrón que
 * `DeleteProjectButton` — nada de `window.confirm`).
 */
export function UserRowActions({
  userId,
  rolActual,
  suspendido,
  esUnoMismo,
}: {
  userId: string;
  rolActual: string | null;
  suspendido: boolean;
  esUnoMismo: boolean;
}) {
  const [roleState, roleAction] = useActionState(changeUserRole, INITIAL);
  const [suspendState, suspendAction] = useActionState(suspendUser, INITIAL);
  const [reactivateState, reactivateAction] = useActionState(reactivateUser, INITIAL);
  const [confirmandoSuspension, setConfirmandoSuspension] = useState(false);
  const reduceMotion = useReducedMotion();

  const error = roleState.error || suspendState.error || reactivateState.error;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center gap-3">
        <form action={roleAction} className="flex items-center gap-2">
          <input type="hidden" name="userId" value={userId} />
          <label className="sr-only" htmlFor={`rol-${userId}`}>
            Rol de {userId}
          </label>
          <Select
            id={`rol-${userId}`}
            name="rol"
            uiSize="sm"
            defaultValue={rolActual ?? "estudiante"}
            disabled={esUnoMismo}
            className="w-28"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
          <button
            type="submit"
            disabled={esUnoMismo}
            className={buttonClasses({ variant: "outline", size: "sm" })}
          >
            Guardar
          </button>
        </form>

        <div className="flex items-center gap-2 border-l border-border pl-3">
          {suspendido ? (
            <form action={reactivateAction}>
              <input type="hidden" name="userId" value={userId} />
              <button type="submit" className={buttonClasses({ variant: "outline-primary", size: "sm" })}>
                Reactivar
              </button>
            </form>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              {confirmandoSuspension ? (
                <motion.div
                  key="confirm"
                  initial={reduceMotion ? false : { opacity: 0, scaleX: 0.4, x: 12 }}
                  animate={{ opacity: 1, scaleX: 1, x: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scaleX: 0.4, x: 12 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  style={{ transformOrigin: "right center" }}
                  className="relative rounded-lg"
                >
                  {/* El aro parpadea de verdad (`animate-ring-blink`, definido en
                      globals.css: alterna abrupto entre visible y casi invisible)
                      en vez de crecer como `animate-ping` o apenas respirar como
                      `animate-pulse` de Tailwind, que pasaba desapercibido. Mismo
                      tamaño siempre, pegado a los botones. Va en un `span` aparte,
                      detrás de los botones: lo que parpadea es el aro, no los
                      botones mismos (que necesitan quedar legibles y clicables todo
                      el rato). */}
                  <span
                    aria-hidden
                    className="animate-ring-blink pointer-events-none absolute inset-0 rounded-lg ring-[3px] ring-coral"
                  />
                  <form action={suspendAction} className="relative flex items-center gap-1.5 p-1">
                    <input type="hidden" name="userId" value={userId} />
                    <button type="submit" className={buttonClasses({ variant: "danger", size: "sm" })}>
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoSuspension(false)}
                      className={buttonClasses({ variant: "ghost", size: "sm" })}
                    >
                      Cancelar
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.button
                  key="trigger"
                  type="button"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  onClick={() => setConfirmandoSuspension(true)}
                  disabled={esUnoMismo}
                  className={buttonClasses({ variant: "outline-danger", size: "sm" })}
                >
                  Suspender
                </motion.button>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-coral">
          {error}
        </p>
      )}
    </div>
  );
}
