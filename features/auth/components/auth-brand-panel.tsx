import Link from "next/link";
import { AuthImagePanel } from "@/features/auth/components/auth-image-panel";

/**
 * Columna izquierda (desktop) de /ingresar y /registro en pantalla completa
 * (entrada directa por URL o refresh, fuera del modal): mismo panel que el
 * modal (`AuthImagePanel`), para que ambos caminos se vean iguales. A
 * diferencia del modal, acá no cambia de lado al cruzar ingresar ↔ registro.
 */
export function AuthBrandPanel() {
  return (
    <aside className="relative hidden min-h-screen flex-1 lg:block">
      <Link
        href="/"
        className="absolute top-10 left-10 z-20 xl:top-12 xl:left-14"
        aria-label="Vardelab"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/vardelab-logo-horizontal-blanco.svg" alt="Vardelab" className="h-6 w-auto" />
      </Link>

      <AuthImagePanel className="min-h-screen" />
    </aside>
  );
}
