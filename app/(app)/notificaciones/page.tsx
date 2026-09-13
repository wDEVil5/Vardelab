import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { getMyNotifications } from "@/features/notifications/queries";
import { NotificationsList } from "@/features/notifications/components/notifications-list";

export const metadata: Metadata = {
  title: "Notificaciones · CampusLab",
};

/**
 * Historial completo de notificaciones (M39/M40) — a diferencia del panel de
 * la campanita (últimas 15, pensado para un vistazo rápido), acá entran
 * todas y se pueden filtrar por leídas/no leídas.
 */
export default async function NotificacionesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?next=/notificaciones");

  const notificaciones = await getMyNotifications(100);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 lg:py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Notificaciones</h1>
        <p className="text-sm text-muted">
          Postulaciones, invitaciones y evaluaciones relacionadas con tu cuenta.
        </p>
      </header>

      <div className="mt-8">
        <NotificationsList notifications={notificaciones} />
      </div>
    </div>
  );
}
