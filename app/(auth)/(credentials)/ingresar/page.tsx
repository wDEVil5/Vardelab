import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Ingresar · Vardelab",
};

/**
 * A-02 · Inicio de sesión. El split y el panel de marca viven en el layout
 * de credenciales; aquí solo el contenido de la tarjeta.
 */
type PageProps = { searchParams: Promise<{ error?: string }> };

export default async function IngresarPage({ searchParams }: PageProps) {
  const { error } = await searchParams;

  return (
    <>
      <h2 className="text-2xl font-bold text-ink">Ingresar</h2>
      <p className="mt-1 text-sm text-muted">
        ¿Aún no tienes cuenta?{" "}
        <Link
          href="/registro"
          className="font-medium text-electric hover:underline"
        >
          Crear cuenta
        </Link>
      </p>

      {error && (
        <p role="alert" className="mt-4 text-sm text-coral">
          {error}
        </p>
      )}

      <div className="mt-6">
        <LoginForm />
      </div>
    </>
  );
}
