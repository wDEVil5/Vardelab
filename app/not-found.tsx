import type { Metadata } from "next";
import Link from "next/link";
import { FallingText } from "@/components/falling-text";

export const metadata: Metadata = {
  title: "Página no encontrada · CampusLab",
};

const FALLING_WORDS =
  "CampusLab Explorar proyectos Organizaciones Cómo funciona Alcance definido Microproyectos reales Estudiantes Colaboración Primera experiencia Roles abiertos Postular Remoto Portafolio Equipos GitHub Habilidades Mentoría Diseño Datos Frontend Backend UX Investigación Impacto Práctica Semanas Cupos Verificado Patrocinador Comunidad Entregable Desafío";

/**
 * 404 raíz. FallingText a pantalla completa.
 * Ajustes de densidad/tipografía pensados para móvil; desktop sigue amplio.
 */
export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-ink text-white">
      <div aria-hidden className="absolute inset-0 z-1">
        <FallingText
          text={FALLING_WORDS}
          highlightWords={[
            "CampusLab",
            "Microproyectos",
            "Alcance",
            "Explorar",
            "Colaboración",
            "Impacto",
          ]}
          highlightClassName="font-bold text-sprout"
          trigger="auto"
          /* Móvil ~1.2–1.4rem; desktop sube hasta 3rem (antes el min 1.85rem
             dejaba palabras demasiado grandes en pantallas chicas). */
          fontSize="clamp(1.2rem, 0.55rem + 2.4vw, 3rem)"
          gravity={0.35}
          mouseConstraintStiffness={0.9}
          className="h-full text-white/90"
        />
      </div>

      <header className="pointer-events-none relative z-10 flex items-center justify-between gap-3 px-4 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-10 sm:py-6">
        <Link
          href="/"
          className="pointer-events-auto shrink-0 text-base font-bold text-white sm:text-lg"
        >
          CampusLab
        </Link>
        <Link
          href="/proyectos"
          className="pointer-events-auto inline-flex max-w-[60%] items-center gap-1 truncate rounded-full border border-white/20 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:border-sprout/60 hover:text-sprout sm:max-w-none sm:gap-1.5 sm:px-5 sm:py-2 sm:text-sm"
        >
          <span className="sm:hidden">Explorar</span>
          <span className="hidden sm:inline">Explorar proyectos</span>
          <span aria-hidden>↗</span>
        </Link>
      </header>

      <main className="pointer-events-none relative z-10 flex flex-1 flex-col items-center justify-start px-5 pb-12 pt-10 text-center sm:px-6 sm:pb-16 sm:pt-24 lg:pt-28">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-extrabold text-white/5"
          style={{ fontSize: "clamp(5.5rem, 28vw, 22rem)", lineHeight: 1 }}
        >
          404
        </span>

        <div className="pointer-events-auto relative z-10 max-w-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50 sm:text-sm">
            Error 404
          </p>
          <h1 className="mt-2 text-3xl tracking-tight sm:mt-3 sm:text-5xl lg:text-6xl">
            <span className="text-white/70">Fuera de</span>{" "}
            <span className="font-bold">alcance.</span>
          </h1>
          <p className="mx-auto mt-3 text-sm leading-relaxed text-white/60 sm:mt-4 sm:text-base">
            Este enlace no tiene un alcance definido: puede que esté mal
            escrito o que la página se haya movido.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-white underline decoration-white/30 underline-offset-4 transition-colors hover:text-sprout hover:decoration-sprout sm:mt-5 sm:text-base"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  );
}
