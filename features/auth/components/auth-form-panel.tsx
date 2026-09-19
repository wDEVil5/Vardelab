import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Columna derecha (desktop) de /ingresar y /registro en pantalla completa:
 * panel blanco de borde a borde, igual que el lado del formulario del modal
 * (`AuthModal`) — ya no es una tarjeta flotando sobre fondo oscuro, es la
 * sección completa de la pantalla.
 */
export function AuthFormPanel({
  children,
  footerNote = "Piloto independiente",
}: {
  children: ReactNode;
  footerNote?: string;
}) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center bg-white px-6 py-12">
      <Link href="/" className="mb-8 lg:hidden" aria-label="Vardelab">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/vardelab-logo-horizontal-negro.svg" alt="Vardelab" className="h-6 w-auto" />
      </Link>

      <div className="w-full max-w-sm">
        {children}
        <p className="mt-6 text-center text-xs text-muted">{footerNote}</p>
      </div>
    </div>
  );
}
