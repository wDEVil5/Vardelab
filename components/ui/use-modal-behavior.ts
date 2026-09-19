"use client";

import { useEffect, useEffectEvent, useRef, type RefObject } from "react";

// Selectores de elementos que pueden recibir foco por teclado, para el trap.
const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/**
 * Comportamiento accesible compartido por los modales de la app: cierre con
 * Escape, trampa de foco (Tab no se escapa hacia el fondo), bloqueo del
 * scroll del body mientras está abierto y devolución del foco a quien lo
 * abrió al cerrar. Extraído de `Modal` para que `AuthModal` (dos columnas,
 * sin barra de título) lo reuse sin duplicar la lógica de accesibilidad.
 */
export function useModalBehavior({
  open,
  onClose,
  busy = false,
  containerRef,
}: {
  open: boolean;
  onClose: () => void;
  busy?: boolean;
  containerRef: RefObject<HTMLElement | null>;
}) {
  const disparadorRef = useRef<HTMLElement | null>(null);
  const closeFromKeyboard = useEffectEvent(() => {
    if (!busy) onClose();
  });

  useEffect(() => {
    if (!open) return;

    disparadorRef.current = document.activeElement as HTMLElement | null;

    const primero = containerRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (primero ?? containerRef.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeFromKeyboard();
        return;
      }
      if (e.key === "Tab" && containerRef.current) {
        const focusables = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
        );
        if (focusables.length === 0) {
          e.preventDefault();
          containerRef.current.focus();
          return;
        }
        const primero = focusables[0];
        const ultimo = focusables[focusables.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === primero ||
            document.activeElement === containerRef.current ||
            !containerRef.current.contains(document.activeElement))
        ) {
          e.preventDefault();
          ultimo.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === ultimo ||
            !containerRef.current.contains(document.activeElement))
        ) {
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
      disparadorRef.current?.focus?.();
    };
  }, [open]);
}
