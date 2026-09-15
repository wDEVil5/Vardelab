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
import { createClient } from "@/lib/supabase/client";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/actions";
import type { Notification } from "@/features/notifications/queries";

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
 * para que marcar como leída y las nuevas que lleguen se reflejen en los dos
 * a la vez. Las notificaciones nuevas llegan por Realtime (M63, mismo patrón
 * que `MessageThread` en M49) en vez del sondeo cada ~25s que se usaba antes
 * — una suscripción a los INSERT de `notifications` filtrada por el usuario
 * actual, en vez de estar preguntando por polling.
 */
export function NotificationsProvider({
  userId,
  initialNotifications,
  initialUnreadCount,
  children,
}: {
  userId: string;
  initialNotifications: Notification[];
  initialUnreadCount: number;
  children: ReactNode;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    let canal: ReturnType<typeof supabase.channel> | null = null;
    let cancelado = false;

    // Igual que en `MessageThread` (M49): Realtime se autentica con la clave
    // anónima, así que hace falta pasarle el token de la sesión actual antes
    // de suscribirse para que la RLS de `notifications` (acotada a
    // `auth.uid()`) deje pasar los INSERT — si no, el canal se suscribe sin
    // error pero nunca llega nada.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelado) return;
      if (session) supabase.realtime.setAuth(session.access_token);

      canal = supabase
        .channel(`notifications-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const fila = payload.new as Notification;
            setNotifications((prev) =>
              prev.some((n) => n.id === fila.id) ? prev : [fila, ...prev],
            );
            setUnreadCount((c) => c + 1);
            setToasts((prev) => [
              ...prev,
              { toastId: `${fila.id}-${Date.now()}`, notification: fila },
            ]);
          },
        )
        .subscribe();
    });

    return () => {
      cancelado = true;
      if (canal) supabase.removeChannel(canal);
    };
  }, [userId]);

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
