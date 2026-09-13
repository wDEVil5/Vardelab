"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  checkForNewNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/actions";
import type { Notification } from "@/features/notifications/queries";

const INTERVALO_SONDEO_MS = 25_000;

export type NotificationToast = { toastId: string; notification: Notification };

type NotificationsContextValue = {
  notifications: Notification[];
  unreadCount: number;
  toasts: NotificationToast[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismissToast: (toastId: string) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

/**
 * Fuente única de las notificaciones del shell: la campanita y los toasts
 * (M42) leen del mismo Context en vez de cada uno llevar su propio estado,
 * para que marcar como leída y el sondeo de nuevas se reflejen en los dos a
 * la vez. Sondea cada ~25s en vez de Realtime (no hay suscripciones en este
 * proyecto todavía — ver nota de "próximo paso" en BACKEND.md) comparando
 * contra la marca de tiempo de la notificación más nueva vista hasta ahora;
 * arranca en el momento en que se monta el shell, así que no dispara toasts
 * de notificaciones que ya existían al cargar la página. El sondeo se salta
 * mientras la pestaña está en segundo plano (evita llamadas inútiles con
 * varias pestañas abiertas) y se dispara una vez de inmediato al volver a
 * primer plano, en vez de esperar hasta el próximo tick del intervalo.
 */
export function NotificationsProvider({
  initialNotifications,
  initialUnreadCount,
  children,
}: {
  initialNotifications: Notification[];
  initialUnreadCount: number;
  children: ReactNode;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const [, startTransition] = useTransition();

  const ultimaVistaRef = useRef(
    initialNotifications[0]?.created_at ?? new Date().toISOString(),
  );

  useEffect(() => {
    let cancelado = false;

    const sondear = async () => {
      if (document.visibilityState !== "visible") return;
      const nuevas = await checkForNewNotifications(ultimaVistaRef.current);
      if (cancelado || nuevas.length === 0) return;

      ultimaVistaRef.current = nuevas[nuevas.length - 1].created_at;
      setNotifications((prev) => [...nuevas].reverse().concat(prev));
      setUnreadCount((c) => c + nuevas.length);
      setToasts((prev) => [
        ...prev,
        ...nuevas.map((n) => ({ toastId: `${n.id}-${Date.now()}`, notification: n })),
      ]);
    };

    const alVolverVisible = () => {
      if (document.visibilityState === "visible") sondear();
    };

    const id = setInterval(sondear, INTERVALO_SONDEO_MS);
    document.addEventListener("visibilitychange", alVolverVisible);

    return () => {
      cancelado = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", alVolverVisible);
    };
  }, []);

  // El auto-cierre y la animación de salida viven en `ToastCard` (cada toast
  // controla su propio tiempo de vida); acá solo se saca del arreglo.
  const dismissToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    const formData = new FormData();
    formData.set("id", id);
    startTransition(() => {
      markNotificationRead(formData);
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
    setUnreadCount(0);
    startTransition(() => {
      markAllNotificationsRead();
    });
  }, []);

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, toasts, markRead, markAllRead, dismissToast }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications debe usarse dentro de NotificationsProvider");
  }
  return ctx;
}
