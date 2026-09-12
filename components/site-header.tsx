import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { NavLink } from "@/components/nav-link";
import { SiteHeaderBar } from "@/components/site-header-bar";
import { MobileMenu, type MobileNavItem } from "@/components/mobile-menu";
import { AccountMenu, type AccountMenuItem } from "@/components/account-menu";
import { getCurrentUser } from "@/features/auth/queries";

/**
 * Cabecera global. Server Component: lee la sesión en el servidor y muestra el
 * estado según haya usuario o no. En desktop, navegación inline; en móvil, un
 * menú hamburguesa (`MobileMenu`). El cierre de sesión usa la Server Action
 * `signOut`.
 */
export async function SiteHeader() {
  const user = await getCurrentUser();

  // Enlaces del menú móvil según la sesión (la acción de sesión la resuelve el
  // propio menú a partir de `userName`).
  const mobileItems: MobileNavItem[] = [
    ...(user ? [{ href: "/inicio", label: "Ir a mi panel" }] : []),
    { href: "/proyectos", label: "Explorar" },
    { href: "/#como-funciona", label: "Cómo funciona" },
    { href: "/organizaciones", label: "Para organizaciones" },
  ];

  // Destinos del menú de cuenta (desktop), según el rol — mismo criterio que
  // arma la navegación del sidebar en `app/(app)/layout.tsx`.
  const accountItems: AccountMenuItem[] = user
    ? [
        { href: "/inicio", label: "Ir a mi panel", icon: "inicio" },
        { href: "/perfil", label: "Mi perfil", icon: "perfil" },
        ...(user.esEstudiante
          ? ([{ href: "/mis-postulaciones", label: "Mis postulaciones", icon: "postulaciones" }] as AccountMenuItem[])
          : []),
        ...(user.esPatrocinador
          ? ([
              { href: "/mis-proyectos", label: "Mis proyectos", icon: "proyecto" },
              { href: "/mis-organizaciones", label: "Mis organizaciones", icon: "organizacion" },
            ] as AccountMenuItem[])
          : []),
        ...(user.esModerador || user.esAdmin
          ? ([{ href: "/moderacion", label: "Moderación", icon: "moderacion" }] as AccountMenuItem[])
          : []),
        ...(user.esAdmin
          ? ([{ href: "/admin", label: "Administración", icon: "admin" }] as AccountMenuItem[])
          : []),
      ]
    : [];

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

        {/* Derecha: sesión (desktop) + menú móvil. */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex md:items-center md:gap-3">
            {user ? (
              <>
                {/* Entrada al panel privado (como "Mi Escritorio"). El cierre de
                    sesión vive dentro del panel (sidebar) y en el menú móvil. */}
                <Link
                  href="/inicio"
                  className={buttonClasses({ variant: "primary", size: "sm" })}
                >
                  Ir a mi panel
                </Link>
                <AccountMenu
                  nombre={user.nombre}
                  email={user.email}
                  avatarUrl={user.avatarUrl}
                  initials={iniciales(user.nombre)}
                  items={accountItems}
                />
              </>
            ) : (
              <Link
                href="/ingresar"
                className={buttonClasses({ variant: "outline", size: "sm" })}
              >
                Iniciar sesión
              </Link>
            )}
          </div>

          {/* Navegación móvil. */}
          <MobileMenu items={mobileItems} userName={user?.nombre ?? null} />
        </div>
      </div>
    </SiteHeaderBar>
  );
}

// Iniciales para el avatar: primeras letras de hasta dos palabras del nombre.
function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  const ini = partes.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return ini || "?";
}
