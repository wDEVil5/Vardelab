"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// Selectores de elementos que pueden recibir foco por teclado, para el trap.
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Ventana modal accesible. Se monta en un portal sobre el resto de la página, con
 * el fondo atenuado y difuminado (backdrop-blur). Se cierra con Escape, el botón
 * de cierre o un clic fuera del recuadro. Mientras está abierta, bloquea el
 * desplazamiento del cuerpo, atrapa el foco de teclado dentro del diálogo (Tab no
 * se escapa hacia el fondo) y, al cerrar, devuelve el foco a quien la abrió. No
 * renderiza nada cuando `open` es falso.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const disparadorRef = useRef<HTMLElement | null>(null);
  // Controla la animación de entrada: nace en `false` (fondo/recuadro
  // invisibles) y pasa a `true` un frame después, para que el navegador anime
  // la transición en vez de pintar directo el estado final — de golpe se
  // sentía muy seco al abrir.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!open) return;

    const raf = requestAnimationFrame(() => setVisible(true));

    // Recuerda quién tenía el foco para devolvérselo al cerrar.
    disparadorRef.current = document.activeElement as HTMLElement | null;

    // Foco inicial: el primer elemento enfocable del diálogo (o el diálogo
    // mismo si no hay ninguno).
    const primero = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (primero ?? dialogRef.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Trap de foco: Tab/Shift+Tab no salen del diálogo.
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
        );
        if (focusables.length === 0) return;
        const primero = focusables[0];
        const ultimo = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);

    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      cancelAnimationFrame(raf);
      // Vuelve a "invisible" para la próxima vez que se abra: sin esto, un
      // segundo `open` reaparecería directo en el estado final, sin animar.
      setVisible(false);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previo;
      // Devuelve el foco a quien abrió el modal (si el elemento sigue en el DOM).
      disparadorRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fondo atenuado y difuminado; un clic cierra. */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className={cn(
          "absolute inset-0 cursor-default bg-ink/40 backdrop-blur-sm transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Recuadro */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-xl transition-all duration-200 focus:outline-none",
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0",
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
