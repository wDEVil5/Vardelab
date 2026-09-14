import type { ReactNode } from "react";
import type { Notification } from "@/features/notifications/queries";

/**
 * Ícono + color por tipo de evento (M39/M40). Mismos trazos que ya usa el
 * resto del shell (`AppSidebar`, `patrocinador-inicio`) para que la
 * campanita y la página `/notificaciones` se sientan parte del mismo
 * sistema, no un widget aparte.
 */
const TRAZOS: Record<Notification["tipo"], ReactNode> = {
  postulacion_recibida: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4V3.5a1 1 0 011-1h4a1 1 0 011 1V4" />
      <path d="M9 12.5l2 2 4-4.5" />
    </>
  ),
  postulacion_aceptada: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </>
  ),
  postulacion_rechazada: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
    </>
  ),
  invitacion_organizacion: (
    <>
      <path d="M3 21h18M5 21V7l7-4 7 4v14" />
      <path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M10 21v-4h4v4" />
    </>
  ),
  evaluacion_nueva: (
    <path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2-5.4 3.2 1.3-6-4.6-4.1 6.1-.6z" />
  ),
  hito_por_vencer: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  mensaje_nuevo: (
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
  ),
};

const TONO: Record<Notification["tipo"], string> = {
  postulacion_recibida: "bg-electric/10 text-electric",
  postulacion_aceptada: "bg-sprout/15 text-sprout",
  postulacion_rechazada: "bg-coral/15 text-coral",
  invitacion_organizacion: "bg-electric/10 text-electric",
  evaluacion_nueva: "bg-electric/10 text-electric",
  hito_por_vencer: "bg-coral/15 text-coral",
  mensaje_nuevo: "bg-electric/10 text-electric",
};

export function NotificationIcon({ tipo }: { tipo: Notification["tipo"] }) {
  return (
    <span
      className={`flex size-9 shrink-0 items-center justify-center rounded-full ${TONO[tipo]}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {TRAZOS[tipo]}
      </svg>
    </span>
  );
}
