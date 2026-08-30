import Link from "next/link";

/**
 * Pie de la landing pública. Minimalista: marca de texto, navegación y una nota
 * de piloto. Sin logos ni datos ficticios.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <Link href="/" className="font-bold text-ink">
              CampusLab
            </Link>
            <p className="max-w-xs text-sm text-muted">
              Microproyectos reales que conectan estudiantes con organizaciones.
            </p>
          </div>

          <nav className="flex flex-col gap-2 text-sm">
            <Link
              href="/proyectos"
              className="text-muted transition-colors hover:text-electric"
            >
              Explorar proyectos
            </Link>
            <a
              href="#como-funciona"
              className="text-muted transition-colors hover:text-electric"
            >
              Cómo funciona
            </a>
            <Link
              href="/organizaciones"
              className="text-muted transition-colors hover:text-electric"
            >
              Para organizaciones
            </Link>
            <Link
              href="/ingresar"
              className="text-muted transition-colors hover:text-electric"
            >
              Iniciar sesión
            </Link>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-[11px] text-muted/80 sm:flex-row sm:items-center sm:justify-between">
          <span>Piloto independiente</span>
          <span className="sm:order-last">
            © {new Date().getFullYear()} CampusLab
          </span>
          <span>
            Desarrollado por Wilnes · Estudiante de Ingeniería en Computación
            &amp; Informática
          </span>
        </div>
      </div>
    </footer>
  );
}
