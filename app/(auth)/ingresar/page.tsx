import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";
import { AuthShell } from "@/features/auth/components/auth-shell";

export const metadata: Metadata = {
  title: "Ingresar · CampusLab",
};

/** A-02 · Inicio de sesión. */
export default function IngresarPage() {
  return (
    <AuthShell
      aside={
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-electric">
            Oportunidades abiertas
          </span>
          <span className="text-lg font-semibold text-white">
            Encuentra un desafío para ti
          </span>
          <p className="text-sm text-white/60">
            Microproyectos reales, por hitos y con evidencia verificable para tu
            portafolio.
          </p>
        </div>
      }
    >
      <div className="rounded-2xl border border-border bg-white p-8">
        <h1 className="text-2xl font-bold text-ink">Bienvenido de vuelta</h1>
        <p className="mt-1 text-sm text-muted">
          Ingresa para continuar con tus proyectos.
        </p>

        <div className="mt-6">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          ¿Aún no tienes cuenta?{" "}
          <Link
            href="/registro"
            className="font-medium text-electric hover:underline"
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
