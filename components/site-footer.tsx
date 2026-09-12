import Link from "next/link";

/**
 * Pie de la landing pública. Minimalista: marca de texto, navegación y una nota
 * de piloto. Sin logos ni datos ficticios. Se muestra con efecto "cortina":
 * queda fijo detrás del contenido (ver `RevealFooter`), que lo cubre y lo
 * revela al llegar al fondo. Fondo oscuro (Ink) a propósito, distinto del
 * resto del sitio: contra un footer claro, el "destape" casi no se notaba (la
 * página y el pie eran del mismo blanco); el contraste de color es lo que
 * hace visible la cortina, no solo el movimiento. El matiz de marca es el
 * mismo halo difuminado del hero de `/organizaciones` (círculo `blur-3xl` que
 * respeta reduced-motion vía `.animate-breathe`), no un degradé con un hex
 * calculado a mano — reutiliza el mismo recurso visual en vez de inventar uno.
 */
export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden rounded-t-[28px] bg-ink shadow-[0_-12px_28px_-20px_rgba(0,0,0,0.45)]">
      <div
        className="animate-breathe pointer-events-none absolute -top-28 right-0 size-72 rounded-full bg-electric/20 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-5xl px-6 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <Link href="/" className="font-bold text-white">
              CampusLab
            </Link>
            <p className="max-w-xs text-sm text-white/70">
              Microproyectos reales que conectan estudiantes con organizaciones.
            </p>
          </div>

          <nav className="flex flex-col gap-2 text-sm">
            <Link
              href="/proyectos"
              className="text-white/70 transition-colors hover:text-white"
            >
              Explorar proyectos
            </Link>
            <Link
              href="/#como-funciona"
              className="text-white/70 transition-colors hover:text-white"
            >
              Cómo funciona
            </Link>
            <Link
              href="/organizaciones"
              className="text-white/70 transition-colors hover:text-white"
            >
              Para organizaciones
            </Link>
            <Link
              href="/proponer"
              className="text-white/70 transition-colors hover:text-white"
            >
              Proponer un desafío
            </Link>
            <Link
              href="/ingresar"
              className="text-white/70 transition-colors hover:text-white"
            >
              Iniciar sesión
            </Link>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-[11px] text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <span>Piloto independiente</span>
          <span className="sm:order-last">
            © {new Date().getFullYear()} CampusLab
          </span>
          <span className="flex items-center gap-2">
            Desarrollado por Wilnes · Estudiante de Ingeniería en Computación
            &amp; Informática
            <a
              href="https://github.com/wDEVil5"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub de Wilnes"
              className="text-white/50 transition-colors hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
                <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/wilnes-devil-5ab6b81a6"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn de Wilnes"
              className="text-white/50 transition-colors hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
                <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
              </svg>
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
