import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Para organizaciones · CampusLab",
  description:
    "Publica un desafío acotado y súmate a un equipo de estudiantes que lo resuelve con acompañamiento.",
};

// Pasos del lado de la organización (vertical del patrocinador).
const PASOS = [
  {
    n: "1",
    titulo: "Publica un desafío",
    texto: "Describe una necesidad acotada y los roles que buscas.",
  },
  {
    n: "2",
    titulo: "Selecciona tu equipo",
    texto: "Revisa postulaciones y acepta a los estudiantes que calcen.",
  },
  {
    n: "3",
    titulo: "Acompaña y evalúa",
    texto: "Sigue los hitos, aprueba entregas y evalúa el trabajo.",
  },
];

/** Home pública para organizaciones (vertical del patrocinador). */
export default function OrganizacionesPage() {
  return (
    <main className="flex-1 bg-surface">
      <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
        {/* Hero */}
        <section className="flex flex-col items-start gap-5">
          <span className="rounded-full bg-electric/10 px-3 py-1 text-sm font-medium text-electric">
            Para organizaciones
          </span>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Convierte una necesidad real en un microproyecto
          </h1>
          <p className="max-w-xl text-lg text-muted">
            Publica un desafío acotado y súmate a un equipo de estudiantes que lo
            resuelve con acompañamiento, por hitos y con evidencia verificable.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/registro"
              className={cn(
                buttonClasses({ variant: "primary" }),
                "h-11 px-6 text-base",
              )}
            >
              Crear cuenta
            </Link>
            <Link
              href="/ingresar"
              className="text-sm font-medium text-electric hover:underline"
            >
              Ya tengo cuenta →
            </Link>
          </div>
        </section>

        {/* Cómo funciona para tu organización */}
        <section className="mt-16">
          <h2 className="text-lg font-semibold text-ink">
            Cómo funciona para tu organización
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {PASOS.map((paso) => (
              <div
                key={paso.n}
                className="flex flex-col gap-2 rounded-lg border border-border bg-white p-5"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-electric/10 text-sm font-semibold text-electric">
                  {paso.n}
                </span>
                <span className="font-semibold text-ink">{paso.titulo}</span>
                <p className="text-sm text-muted">{paso.texto}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
