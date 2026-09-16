"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  removeTeamMember,
  type RemoveTeamMemberState,
} from "@/features/applications/actions";
import { buttonClasses } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

const INITIAL: RemoveTeamMemberState = {};
const EASE = [0.22, 1, 0.36, 1] as const;

function IconFlecha({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function IconQuitar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/**
 * "Ver perfil" + "Quitar del equipo" (M76): antes no existía ningún camino a
 * propósito para lo segundo, solo borrar el rol entero (que de paso destruía
 * la postulación). Confirmación en dos pasos, sin `confirm()` del navegador
 * — mismo patrón que `ConfirmTeamButton`.
 *
 * El link "Ver perfil" vive acá adentro (no al lado, en la página) a
 * propósito: esta fila está en una lista angosta con `overflow-y-auto`, sin
 * espacio de sobra. Confirmar "Sí, quitar" / "Cancelar" con su texto
 * completo no entra si el link sigue ocupando lugar, así que se oculta
 * mientras se confirma — no hace falta navegar al perfil en ese momento.
 *
 * El confirm "sale" del botón X (`transformOrigin: right`, `scaleX` de 0.4 a
 * 1) en vez de aparecer de golpe — con `mode="wait"` para que los íconos
 * terminen de irse antes de que el confirm empiece a crecer, así no se
 * superponen mientras cambia el ancho de la fila.
 */
export function RemoveTeamMemberButton({
  teamMemberId,
  projectId,
  userId,
  nombre,
}: {
  teamMemberId: string;
  projectId: string;
  userId: string;
  nombre: string;
}) {
  const [state, formAction] = useActionState(removeTeamMember, INITIAL);
  const [confirmando, setConfirmando] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      {confirmando ? (
        <motion.div
          key="confirm"
          initial={reduceMotion ? false : { opacity: 0, scaleX: 0.4, x: 12 }}
          animate={{ opacity: 1, scaleX: 1, x: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, scaleX: 0.4, x: 12 }}
          transition={{ duration: 0.2, ease: EASE }}
          style={{ transformOrigin: "right center" }}
          className="relative shrink-0 rounded-lg"
        >
          {/* Mismo aro parpadeante que `user-row-actions.tsx` (`animate-ring-blink`,
              definido en globals.css): alterna abrupto entre visible y casi
              invisible, a diferencia del fundido de `animate-pulse` de Tailwind,
              que pasaba desapercibido en una confirmación destructiva.
              `ring-inset`: esta fila vive dentro de una lista con
              `overflow-y-auto`, y por spec CSS eso recorta también el eje
              horizontal — un aro que se dibuja hacia afuera del box quedaba
              cortado en los bordes. Hacia adentro nunca se corta. */}
          <span
            aria-hidden
            className="animate-ring-blink pointer-events-none absolute inset-0 rounded-lg ring-[3px] ring-inset ring-coral"
          />
          <form
            action={formAction}
            className="relative flex items-center gap-1.5 p-1"
          >
            <input type="hidden" name="teamMemberId" value={teamMemberId} />
            <input type="hidden" name="projectId" value={projectId} />
            <SubmitButton variant="danger" size="sm" pendingText="Quitando…">
              Sí, quitar
            </SubmitButton>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              Cancelar
            </button>
            {state.error && (
              <p role="alert" className="text-xs text-coral">
                {state.error}
              </p>
            )}
          </form>
        </motion.div>
      ) : (
        <motion.div
          key="actions"
          initial={reduceMotion ? false : { opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, x: -8 }}
          transition={{ duration: 0.15, ease: EASE }}
          className="flex shrink-0 items-center gap-1"
        >
          {/* Todo integrante llegó al equipo aceptando una postulación a este
              proyecto, así que el gestor ya tiene permiso de ver su perfil
              completo por RLS (M13) sea público o no. */}
          <Link
            href={`/u/${userId}`}
            aria-label="Ver perfil"
            title="Ver perfil"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-electric/10 hover:text-electric"
          >
            <IconFlecha className="size-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            aria-label={`Quitar a ${nombre} del equipo`}
            title="Quitar del equipo"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-coral/10 hover:text-coral"
          >
            <IconQuitar className="size-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
