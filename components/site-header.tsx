import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { NavLink } from "@/components/nav-link";
import { SiteHeaderBar } from "@/components/site-header-bar";
import { MobileMenu, type MobileNavItem } from "@/components/mobile-menu";
import { signOut } from "@/features/auth/actions";
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
    { href: "/proyectos", label: "Explorar" },
    ...(user?.esPatrocinador
      ? [
          { href: "/mis-organizaciones", label: "Organizaciones" },
          { href: "/mis-proyectos", label: "Mis proyectos" },
        ]
      : []),
    ...(user?.esEstudiante
      ? [{ href: "/mis-postulaciones", label: "Mis postulaciones" }]
      : []),
    ...(user ? [{ href: "/perfil", label: "Mi perfil" }] : []),
    ...(!user
      ? [
          { href: "/#como-funciona", label: "Cómo funciona" },
          { href: "/organizaciones", label: "Para organizaciones" },
        ]
      : []),
  ];

  return (
    <SiteHeaderBar>
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-6">
        <Link href="/" className="font-bold text-ink">
          CampusLab
        </Link>

        {/* Navegación desktop. */}
        <nav className="hidden items-center gap-5 md:flex">
          <NavLink href="/proyectos">Explorar</NavLink>

          {user?.esPatrocinador && (
            <>
              <NavLink href="/mis-organizaciones" className="hidden sm:inline">
                Organizaciones
              </NavLink>
              <NavLink href="/mis-proyectos">Mis proyectos</NavLink>
            </>
          )}
          {user?.esEstudiante && (
            <NavLink href="/mis-postulaciones">Mis postulaciones</NavLink>
          )}
          {!user && (
            <>
              <NavLink href="/#como-funciona" className="hidden sm:inline">
                Cómo funciona
              </NavLink>
              <NavLink href="/organizaciones" className="hidden sm:inline">
                Organizaciones
              </NavLink>
            </>
          )}

          {user ? (
            <>
              <Link
                href="/perfil"
                className="text-sm font-medium text-muted transition-colors hover:text-electric"
              >
                {user.nombre}
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className={buttonClasses({ variant: "ghost", size: "sm" })}
                >
                  Cerrar sesión
                </button>
              </form>
            </>
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
