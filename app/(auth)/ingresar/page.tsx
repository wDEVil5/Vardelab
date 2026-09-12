import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Ingresar · CampusLab",
};

/**
 * A-02 · Inicio de sesión. Dos columnas otra vez, pero no el `AuthShell`
 * anterior (panel oscuro + carrusel): a la izquierda el mensaje de marca con
 * acentos geométricos en los colores de CampusLab (electric/sprout/coral) en
 * vez de una ilustración, a la derecha la tarjeta del formulario. Columna
 * izquierda oculta en mobile — el formulario es lo único imprescindible ahí.
 */
type PageProps = { searchParams: Promise<{ error?: string }> };

export default async function IngresarPage({ searchParams }: PageProps) {
  const { error } = await searchParams;

  return (
    <div className="animate-fade-in flex min-h-screen bg-surface">
      <div className="relative hidden flex-1 flex-col overflow-hidden p-10 lg:flex">
        <Link href="/" className="text-lg font-bold text-ink">
          CampusLab
        </Link>

        <div className="mt-20 max-w-md">
          <h1 className="text-5xl leading-[1.1] font-bold text-ink">
            Tu próximo desafío empieza acá.
          </h1>
          <p className="mt-4 text-lg text-muted">
            Microproyectos reales que conectan estudiantes con organizaciones.
          </p>
        </div>

        {/* Acentos geométricos: mismos tokens de color que el resto del sitio. */}
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-electric/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-12 left-16 size-28 rounded-full bg-sprout/20 blur-xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-40 left-56 size-12 rotate-45 rounded-xl border-2 border-electric/30"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute bottom-64 left-40 size-2.5 rounded-full bg-coral/50"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute bottom-28 left-72 size-2 rounded-full bg-electric/50"
          aria-hidden
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <Link href="/" className="mb-8 text-lg font-bold text-ink lg:hidden">
          CampusLab
        </Link>

        <div className="w-full max-w-sm rounded-3xl border border-border bg-white p-8 shadow-[0_4px_16px_-8px_rgba(13,37,59,0.12)]">
          <h2 className="text-center text-2xl font-bold text-ink">Ingresar</h2>
          <p className="mt-1 text-center text-sm text-muted">
            ¿Aún no tienes cuenta?{" "}
            <Link
              href="/registro"
              className="font-medium text-electric hover:underline"
            >
              Crear cuenta
            </Link>
          </p>

          {error && (
            <p role="alert" className="mt-4 text-center text-sm text-coral">
              {error}
            </p>
          )}

          <div className="mt-6">
            <LoginForm />
          </div>
        </div>

        <p className="mt-6 text-xs text-muted">Piloto independiente</p>
      </div>
    </div>
  );
}
