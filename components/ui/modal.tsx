"use client";

import { useEffect, useEffectEvent, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createPortal } from "react-dom";

// Selectores de elementos que pueden recibir foco por teclado, para el trap.
const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/**
 * Ventana modal accesible. Se monta en un portal sobre el resto de la página, con
 * el fondo atenuado y difuminado (backdrop-blur). Se cierra con Escape, el botón
 * de cierre o un clic fuera del recuadro. Mientras está abierta, bloquea el
 * desplazamiento del cuerpo, atrapa el foco de teclado dentro del diálogo (Tab no
 * se escapa hacia el fondo) y, al cerrar, devuelve el foco a quien la abrió. No
 * desmonta el contenido al terminar la animación de salida.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  busy?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const disparadorRef = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const closeFromKeyboard = useEffectEvent(() => { if (!busy) onClose(); });

  useEffect(() => {
    if (!open) return;

    // Recuerda quién tenía el foco para devolvérselo al cerrar.
    disparadorRef.current = document.activeElement as HTMLElement | null;

    // Foco inicial: el primer elemento enfocable del diálogo (o el diálogo
    // mismo si no hay ninguno).
    const primero = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (primero ?? dialogRef.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeFromKeyboard();
        return;
      }
      // Trap de foco: Tab/Shift+Tab no salen del diálogo.
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
        );
        if (focusables.length === 0) { e.preventDefault(); dialogRef.current.focus(); return; }
        const primero = focusables[0];
        const ultimo = focusables[focusables.length - 1];
        if (e.shiftKey && (document.activeElement === primero || document.activeElement === dialogRef.current || !dialogRef.current.contains(document.activeElement))) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && (document.activeElement === ultimo || !dialogRef.current.contains(document.activeElement))) {
          e.preventDefault();
          primero.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);

    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previo;
      // Devuelve el foco a quien abrió el modal (si el elemento sigue en el DOM).
      disparadorRef.current?.focus?.();
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
    {open && <motion.div key="modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fondo atenuado y difuminado; un clic cierra. */}
      <motion.button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        disabled={busy}
        tabIndex={-1}
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{
          opacity: 1,
          backdropFilter: reduce ? "blur(0px)" : "blur(4px)",
        }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        transition={{ duration: reduce ? 0 : 0.18, ease: "easeOut" }}
        className="absolute inset-0 cursor-default bg-ink/40 will-change-[opacity,backdrop-filter]"
      />

      {/* Recuadro */}
      <motion.div
        layout={reduce ? false : "size"}
        initial={{ opacity: 0, y: reduce ? 0 : 12, scale: reduce ? 1 : 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: reduce ? 0 : 6, scale: reduce ? 1 : 0.98 }}
        transition={{ duration: reduce ? 0 : 0.2 }}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        aria-busy={busy}
        className="relative z-10 flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-xl focus:outline-none"
      >
        <motion.div layout={reduce ? false : "position"} className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar"
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-electric disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </motion.div>
        <motion.div layout={reduce ? false : "position"} className="overflow-y-auto px-6 py-5">{children}</motion.div>
      </motion.div>
    </motion.div>}
    </AnimatePresence>,
    document.body,
  );
}
