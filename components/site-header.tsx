import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
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
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
        <Link href="/proyectos" className="font-bold text-ink">
          CampusLab
        </Link>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              {user.esPatrocinador && (
                <Link
                  href="/mis-proyectos"
                  className="text-sm text-muted transition-colors hover:text-electric"
                >
                  Mis proyectos
                </Link>
              )}
              {user.esEstudiante && (
                <Link
                  href="/mis-postulaciones"
                  className="text-sm text-muted transition-colors hover:text-electric"
                >
                  Mis postulaciones
                </Link>
              )}
              <span className="hidden text-sm text-muted sm:inline">
                {user.nombre}
              </span>
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
            <>
              <Link
                href="/ingresar"
                className={buttonClasses({ variant: "ghost", size: "sm" })}
              >
                Ingresar
              </Link>
              <Link
                href="/registro"
                className={buttonClasses({ variant: "primary", size: "sm" })}
              >
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
