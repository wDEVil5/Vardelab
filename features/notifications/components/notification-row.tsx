import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Notification } from "@/features/notifications/queries";
import { NotificationIcon } from "@/features/notifications/components/notification-icon";

// Tiempo relativo, sin ambigüedad (mismo criterio que `reports-table.tsx`).
export function haceCuanto(iso: string): string {
  const horas = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (horas < 1) return "hace unos minutos";
  if (horas < 24) return `hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
}

/**
 * Una notificación, compartida entre el panel de la campanita y la página
 * `/notificaciones`. Sin link, es un botón (marca como leída); con link, es
 * la navegación real además de marcarla leída.
 */
export function NotificationRow({
  notification,
  onRead,
  onNavigate,
}: {
  notification: Notification;
  onRead: () => void;
  /** Además de marcar como leída, cierra el panel que la contiene (solo aplica cuando hay link). */
  onNavigate?: () => void;
}) {
  const contenido = (
    <div className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface">
      <NotificationIcon tipo={notification.tipo} />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm",
            notification.leida ? "text-muted" : "font-medium text-ink",
          )}
        >
          {notification.mensaje}
        </p>
        <p className="mt-0.5 text-xs text-muted/70">
          {haceCuanto(notification.created_at)}
        </p>
      </div>
      {!notification.leida && (
        <span className="mt-2 size-2 shrink-0 rounded-full bg-electric" aria-hidden />
      )}
    </div>
  );

  if (notification.link) {
    return (
      <Link
        href={notification.link}
        role="menuitem"
        onClick={() => {
          onRead();
          onNavigate?.();
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
      role="menuitem"
      onClick={onRead}
      disabled={notification.leida}
      className="block w-full disabled:cursor-default"
    >
      {contenido}
    </button>
  );
}
