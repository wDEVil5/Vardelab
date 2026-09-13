"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  type NotificationToast,
} from "@/features/notifications/notifications-context";
import { NotificationIcon } from "@/features/notifications/components/notification-icon";

const DURACION_MS = 6_000;
const DURACION_TRANSICION_MS = 200;

/**
 * Popups de notificaciones nuevas (M42), detectadas por el sondeo del
 * `NotificationsProvider`. Un portal separado del panel de la campanita —
 * puede haber un toast en pantalla con la campanita cerrada. Cada toast
 * controla su propio ciclo de vida (entra animado, se retira solo a los 6s o
 * antes si se hace click), así el `NotificationsProvider` solo necesita
 * saber sumarlos y sacarlos del arreglo.
 */
export function NotificationToasts() {
  const { toasts, dismissToast, markRead } = useNotifications();

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <ToastCard
          key={t.toastId}
          toast={t}
          onRead={() => markRead(t.notification.id)}
          onDismiss={() => dismissToast(t.toastId)}
        />
      ))}
    </div>,
    document.body,
  );
}

function ToastCard({
  toast,
  onRead,
  onDismiss,
}: {
  toast: NotificationToast;
  onRead: () => void;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const { notification } = toast;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(cerrar, DURACION_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cerrar() {
    setVisible(false);
    setTimeout(onDismiss, DURACION_TRANSICION_MS);
  }

  const contenido = (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-border bg-white p-3 shadow-lg transition-all",
        visible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0",
      )}
      style={{ transitionDuration: `${DURACION_TRANSICION_MS}ms` }}
    >
      <NotificationIcon tipo={notification.tipo} />
      <p className="min-w-0 flex-1 text-sm font-medium text-ink">
        {notification.mensaje}
      </p>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          cerrar();
        }}
        aria-label="Cerrar"
        className="shrink-0 text-muted transition-colors hover:text-ink"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );

  if (notification.link) {
    return (
      <Link
        href={notification.link}
        onClick={() => {
          onRead();
          cerrar();
        }}
        className="block"
      >
        {contenido}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        onRead();
        cerrar();
      }}
      className="block w-full text-left"
    >
      {contenido}
    </button>
  );
}
