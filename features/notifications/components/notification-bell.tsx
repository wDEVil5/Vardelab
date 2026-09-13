"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useNotifications } from "@/features/notifications/notifications-context";
import { NotificationRow } from "@/features/notifications/components/notification-row";

/**
 * Campanita de notificaciones del shell (M39/M40/M42). El panel se monta en
 * un portal sobre `document.body`, no como un simple `absolute` anidado en
 * el contenedor del sidebar — ese contenedor tiene `overflow-x-hidden` (para
 * la animación de plegado) y recortaría el panel a la mitad. Lee del
 * `NotificationsProvider` compartido (no de estado propio) para que marcar
 * como leída y las notificaciones nuevas detectadas por el sondeo se
 * reflejen igual acá y en los toasts.
 */
export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [posicion, setPosicion] = useState<{ top: number; left: number } | null>(null);

  const botonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const ANCHO_PANEL = 320; // debe coincidir con el w-80 del panel.

  // Ancla el panel por la izquierda del botón (natural cuando la campanita
  // vive en el sidebar, pegada al borde izquierdo de la pantalla) y lo
  // corrige hacia la izquierda si no entra a la derecha (caso del header
  // móvil, con la campanita cerca del borde derecho) — nunca lo deja
  // recortado fuera del viewport en ninguno de los dos casos.
  function alternar() {
    if (!open && botonRef.current) {
      const r = botonRef.current.getBoundingClientRect();
      const left = Math.min(
        Math.max(16, r.left),
        window.innerWidth - ANCHO_PANEL - 16,
      );
      setPosicion({ top: r.bottom + 8, left });
    }
    setOpen((o) => !o);
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (
        botonRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onScroll() {
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const noLeidasLista = notifications.filter((n) => !n.leida);
  const leidasLista = notifications.filter((n) => n.leida);

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        onClick={alternar}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : "Notificaciones"
        }
        className="relative flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-coral" />
        )}
      </button>

      {open &&
        posicion &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            aria-label="Notificaciones"
            style={{ top: posicion.top, left: posicion.left }}
            className="fixed z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-border bg-white p-2 shadow-lg"
          >
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-sm font-semibold text-ink">Notificaciones</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-medium text-electric hover:underline"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div className="h-px bg-border" />

            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted">
                Todavía no hay notificaciones.
              </p>
            ) : (
              <div className="flex max-h-96 flex-col gap-2 overflow-y-auto py-1">
                {noLeidasLista.length > 0 && (
                  <div className="flex flex-col gap-0.5">
                    <p className="px-3 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted/70">
                      No leídas
                    </p>
                    {noLeidasLista.map((n) => (
                      <NotificationRow
                        key={n.id}
                        notification={n}
                        onRead={() => markRead(n.id)}
                        onNavigate={() => setOpen(false)}
                      />
                    ))}
                  </div>
                )}
                {leidasLista.length > 0 && (
                  <div className="flex flex-col gap-0.5">
                    {noLeidasLista.length > 0 && (
                      <p className="px-3 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted/70">
                        Anteriores
                      </p>
                    )}
                    {leidasLista.map((n) => (
                      <NotificationRow
                        key={n.id}
                        notification={n}
                        onRead={() => markRead(n.id)}
                        onNavigate={() => setOpen(false)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="h-px bg-border" />
            <Link
              href="/notificaciones"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-center text-sm font-medium text-electric transition-colors hover:bg-surface"
            >
              Ver todas
            </Link>
          </div>,
          document.body,
        )}
    </>
  );
}
