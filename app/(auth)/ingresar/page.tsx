import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";
import { AuthShell, AuthSlide } from "@/features/auth/components/auth-shell";

export const metadata: Metadata = {
  title: "Ingresar · CampusLab",
};

// Diapositivas de información del panel (rotan solas, se pueden seleccionar).
const SLIDES = [
  <AuthSlide
    key="oportunidades"
    eyebrow="Oportunidades abiertas"
    titulo="Encuentra un desafío para ti"
  >
    <p className="text-sm text-white/60">
      Microproyectos reales, por hitos y con evidencia verificable para tu
      portafolio.
    </p>
  </AuthSlide>,
  <AuthSlide
    key="evidencia"
    eyebrow="Evidencia verificable"
    titulo="Tu trabajo, demostrable"
  >
    <p className="text-sm text-white/60">
      Cada participación queda ligada a una organización real: es un hecho, no
      una línea más de CV.
    </p>
  </AuthSlide>,
  <AuthSlide key="piloto" eyebrow="El piloto" titulo="Del desafío a tu portafolio">
    <p className="text-sm text-white/60">
      10+ proyectos piloto · 4 semanas de duración promedio, con acompañamiento.
    </p>
  </AuthSlide>,
];

/** A-02 · Inicio de sesión. */
export default function IngresarPage() {
  return (
    <AuthShell slides={SLIDES}>
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
