import Link from "next/link";
import { NavLink } from "@/components/nav-link";
import { SiteHeaderBar } from "@/components/site-header-bar";
import { SiteAuthStatus } from "@/components/site-auth-status";

/**
 * Cabecera global. Sin dependencias dinámicas (no lee cookies): el estado de
 * sesión lo resuelve `SiteAuthStatus` en el navegador. Así las páginas
 * públicas que no necesitan sesión por su cuenta (landing, catálogo,
 * organizaciones...) pueden servirse estáticas en vez de forzarse a
 * dinámicas solo por el header.
 */
export function SiteHeader() {
  return (
    <SiteHeaderBar>
      <div className="relative mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-6">
        {/* En el sitio público la marca lleva siempre a la portada pública. La
            entrada al panel privado es el botón "Ir a mi panel" (ver derecha). */}
        <Link href="/" className="font-bold text-ink">
          CampusLab
        </Link>

        {/* Navegación desktop CENTRADA (absoluta). Solo enlaces PÚBLICOS (igual
            con o sin sesión); lo privado vive en la sidebar del panel, accesible
            con "Ir a mi panel". */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-5 md:flex">
          <NavLink href="/proyectos">Explorar</NavLink>
          <NavLink href="/#como-funciona">Cómo funciona</NavLink>
          <NavLink href="/organizaciones">Para organizaciones</NavLink>
        </nav>

        <SiteAuthStatus />
      </div>
    </SiteHeaderBar>
  );
}
