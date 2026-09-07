import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { NavLink } from "@/components/nav-link";
import { SiteHeaderBar } from "@/components/site-header-bar";
import { MobileMenu, type MobileNavItem } from "@/components/mobile-menu";
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

  return (
    <SiteHeaderBar>
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-6">
        {/* En el sitio público la marca lleva siempre a la portada pública. La
            entrada al panel privado es el botón "Ir a mi panel" (ver derecha). */}
        <Link href="/" className="font-bold text-ink">
          CampusLab
        </Link>

        {/* Navegación desktop. Solo enlaces PÚBLICOS (igual con o sin sesión):
            lo privado (mis proyectos, postulaciones, moderación, organizaciones)
            vive en la sidebar del panel, accesible con "Ir a mi panel". */}
        <nav className="hidden items-center gap-5 md:flex">
          <NavLink href="/proyectos">Explorar</NavLink>
          <NavLink href="/#como-funciona" className="hidden sm:inline">
            Cómo funciona
          </NavLink>
          <NavLink href="/organizaciones" className="hidden sm:inline">
            Para organizaciones
          </NavLink>

          {user ? (
            <div className="flex items-center gap-3">
              {/* Entrada al panel privado (como "Mi Escritorio"). El cierre de
                  sesión vive dentro del panel (sidebar) y en el menú móvil. */}
              <Link
                href="/inicio"
                className={buttonClasses({ variant: "primary", size: "sm" })}
              >
                Ir a mi panel
              </Link>
              <Link
                href="/perfil"
                aria-label={`Mi perfil (${user.nombre})`}
                title={user.nombre}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                {iniciales(user.nombre)}
              </Link>
            </div>
          ) : (
            <Link
              href="/ingresar"
              className={buttonClasses({ variant: "outline", size: "sm" })}
            >
              Iniciar sesión
            </Link>
          )}
        </nav>

        {/* Navegación móvil. */}
        <MobileMenu items={mobileItems} userName={user?.nombre ?? null} />
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
