import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Proponer un desafío · CampusLab",
  description:
    "¿Conoces una organización con una necesidad concreta? Ayúdanos a convertirla en un microproyecto.",
};

/**
 * Placeholder de "Proponer un desafío". La función (form → revisión) se habilita
 * más adelante; por ahora explica la idea y ofrece las acciones existentes.
 */
export default function ProponerPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start gap-6 bg-white px-6 py-16 sm:py-24">
      <span className="rounded-full bg-electric/10 px-3 py-1 text-sm font-medium text-electric">
        Próximamente
      </span>
      <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Proponer un desafío
      </h1>
      <p className="max-w-md text-lg text-muted">
        ¿Conoces una organización con una necesidad concreta? Pronto podrás
        proponerla aquí para convertirla en un microproyecto real. Estamos
        habilitando esta función.
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link
          href="/proyectos"
          className={cn(
            buttonClasses({ variant: "primary" }),
            "h-11 px-6 text-base",
          )}
        >
          Explorar proyectos
        </Link>
        <Link
          href="/registro"
          className="text-sm font-medium text-electric hover:underline"
        >
          Crear cuenta
        </Link>
      </div>
    </main>
  );
}
