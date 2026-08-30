import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { NavLink } from "@/components/nav-link";
import { signOut } from "@/features/auth/actions";
import { getCurrentUser } from "@/features/auth/queries";

/**
 * Cabecera global. Server Component: lee la sesión en el servidor y muestra el
 * estado según haya usuario o no. El cierre de sesión usa la Server Action
 * `signOut` a través de un <form> (no requiere JS en el cliente).
 */
export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-6">
        <Link href="/" className="font-bold text-ink">
          CampusLab
        </Link>

        <nav className="flex items-center gap-5">
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
            <NavLink href="/organizaciones" className="hidden sm:inline">
              Organizaciones
            </NavLink>
          )}

          {user ? (
            <>
              <Link
                href="/perfil"
                className="hidden text-sm font-medium text-muted transition-colors hover:text-electric sm:inline"
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
              className={buttonClasses({ variant: "primary", size: "sm" })}
            >
              Acceder
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
