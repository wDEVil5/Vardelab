import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página no encontrada · CampusLab",
};

// Atajos de la cinta decorativa (dos filas cruzadas, una encima de la otra).
const CINTA_1 = ["Explorar proyectos", "Para organizaciones", "Cómo funciona"];
const CINTA_2 = ["Error 404", "Portafolio verificable", "Alcance definido"];

/**
 * 404 raíz: cubre cualquier ruta sin match (no solo dentro de un grupo de
 * ruta) y cualquier `notFound()` que no tenga un `not-found.tsx` más cercano.
 * Autocontenida (no depende del header de `(site)` ni del shell de `(app)`,
 * que no llegan a montarse para una URL que no matchea ninguna ruta).
 *
 * Fondo oscuro (Ink) deliberado: no es un color nuevo, es el mismo tono del
 * sidebar del panel — un momento con más carácter para una página que, por
 * definición, es un tropiezo. El chiste del copy ("fuera de alcance") juega
 * con "alcance definido", el concepto central de la sección de Principios.
 */
export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-ink text-white">
      {/* Barra superior mínima */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
        <Link href="/" className="text-lg font-bold text-white">
          CampusLab
        </Link>
        <Link
          href="/proyectos"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white transition-colors hover:border-sprout/60 hover:text-sprout"
        >
          Explorar proyectos
          <span aria-hidden>↗</span>
        </Link>
      </header>

      {/* Centro: watermark "404" + mensaje */}
      <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-extrabold text-white/5"
          style={{ fontSize: "clamp(7rem, 26vw, 22rem)", lineHeight: 1 }}
        >
          404
        </span>

        <div className="relative z-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/50">
            Error 404
          </p>
          <h1 className="mt-3 text-4xl tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-white/70">Fuera de</span>{" "}
            <span className="font-bold">alcance.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-white/60">
            Este enlace no tiene un alcance definido: puede que esté mal
            escrito o que la página se haya movido.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block font-medium text-white underline decoration-white/30 underline-offset-4 transition-colors hover:text-sprout hover:decoration-sprout"
          >
            Volver al inicio
          </Link>
        </div>
      </main>

      {/* Cinta decorativa: dos filas cruzadas + acentos (solo en pantallas anchas) */}
      <div
        aria-hidden
        className="relative hidden h-40 shrink-0 md:block"
      >
        <div className="absolute inset-x-[-5%] top-2 -rotate-2 border-y border-ink bg-white py-3 text-ink shadow-sm">
          <Cinta items={CINTA_1} />
        </div>
        <div className="absolute inset-x-[-5%] top-16 rotate-2 border-y border-white/15 bg-ink py-3 text-white">
          <Cinta items={CINTA_2} />
        </div>

        <Diamante className="right-16 bottom-4 bg-electric" />
        <Diamante className="right-40 bottom-14 bg-sprout" />
      </div>
    </div>
  );
}

// Una fila de atajos separados por punto, repetida para simular una cinta
// continua (decorativa: no son enlaces, solo dan sabor a la página de error).
function Cinta({ items }: { items: string[] }) {
  const fila = [...items, ...items];
  return (
    <div className="flex justify-around whitespace-nowrap text-sm font-medium sm:text-base">
      {fila.map((item, i) => (
        <span key={i} className="flex items-center gap-6">
          {item}
          <span className="opacity-40">•</span>
        </span>
      ))}
    </div>
  );
}

// Acento romboidal (cuadrado rotado), decorativo, con una flecha que se
// contra-rota para leerse derecha.
function Diamante({ className }: { className: string }) {
  return (
    <span
      className={`absolute flex size-12 rotate-45 items-center justify-center rounded-md text-ink ${className}`}
    >
      <span className="-rotate-45 text-lg" aria-hidden>
        ↓
      </span>
    </span>
  );
}
