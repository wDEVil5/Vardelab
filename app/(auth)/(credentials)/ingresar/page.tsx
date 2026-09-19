import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-form";
import { safeNextPath } from "@/features/auth/constants";

export const metadata: Metadata = {
  title: "Ingresar · Vardelab",
};

/**
 * A-02 · Inicio de sesión. El split y el panel de marca viven en el layout
 * de credenciales; aquí solo el contenido de la tarjeta. El link a /registro
 * usa <a> normal (no <Link>): los modales son solo para el "frente"
 * (landing) — en la página completa, cruzar a /registro debe quedarse en
 * página completa, nunca abrir un modal encima de sí misma.
 */
type PageProps = { searchParams: Promise<{ error?: string; next?: string }> };

export default async function IngresarPage({ searchParams }: PageProps) {
  const { error, next } = await searchParams;

  return (
    <>
      <h2 className="text-2xl font-bold text-ink">Ingresar</h2>
      <p className="mt-1 text-sm text-muted">
        ¿Aún no tienes cuenta?{" "}
        <a
          href="/registro"
          className="font-medium text-electric hover:underline"
        >
          Crear cuenta
        </a>
      </p>

      {error && (
        <p role="alert" className="mt-4 text-sm text-coral">
          {error}
        </p>
      )}

      <div className="mt-6">
        <LoginForm redirectTo={safeNextPath(next)} />
      </div>
    </>
  );
}
