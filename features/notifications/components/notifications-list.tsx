"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/actions";
import type { Notification } from "@/features/notifications/queries";
import { NotificationRow } from "@/features/notifications/components/notification-row";

type FiltroId = "todas" | "no_leidas";

const FILTROS: { id: FiltroId; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "no_leidas", label: "No leídas" },
];

/**
 * Lista completa de `/notificaciones`, filtrable por leídas/no leídas
 * (mismo patrón de píldoras que `ReportsTable`). Mantiene su propio estado
 * local igual que la campanita — ambas parten de la misma tabla pero no
 * comparten instancia, así que marcar como leída acá no actualiza el badge
 * del sidebar hasta la próxima carga del shell.
 */
export function NotificationsList({
  notifications: iniciales,
}: {
  notifications: Notification[];
}) {
  const [notificaciones, setNotificaciones] = useState(iniciales);
  const [filtro, setFiltro] = useState<FiltroId>("todas");
  const [, startTransition] = useTransition();

  const noLeidas = notificaciones.filter((n) => !n.leida);
  const visibles = filtro === "no_leidas" ? noLeidas : notificaciones;

  function marcarLeida(id: string) {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n)),
    );
    const formData = new FormData();
    formData.set("id", id);
    startTransition(() => {
      markNotificationRead(formData);
    });
  }

  function marcarTodasLeidas() {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    startTransition(() => {
      markAllNotificationsRead();
    });
  }

  if (notificaciones.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
        <p className="font-medium text-ink">Todavía no hay notificaciones</p>
        <p className="mt-1 text-sm text-muted">
          Postulaciones, invitaciones y evaluaciones van a aparecer acá.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Filtrar por leídas"
          className="inline-flex flex-wrap gap-1 self-start rounded-full bg-surface p-1"
        >
          {FILTROS.map((f) => {
            const activo = filtro === f.id;
            const conteo = f.id === "no_leidas" ? noLeidas.length : notificaciones.length;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={activo}
                onClick={() => setFiltro(f.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  activo ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
                )}
              >
                {f.label}
                <span className="text-xs tabular-nums text-muted/70">{conteo}</span>
              </button>
            );
          })}
        </div>

        {noLeidas.length > 0 && (
          <button
            type="button"
            onClick={marcarTodasLeidas}
            className="text-sm font-medium text-electric hover:underline"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {visibles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <p className="text-sm text-muted">No hay notificaciones sin leer.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5 rounded-2xl border border-border bg-white p-2">
          {visibles.map((n) => (
            <NotificationRow
              key={n.id}
              notification={n}
              onRead={() => marcarLeida(n.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
