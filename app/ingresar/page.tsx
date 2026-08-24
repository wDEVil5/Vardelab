import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Ingresar · CampusLab",
};

/** A-01 · Inicio de sesión. */
export default function IngresarPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Ingresar</h1>
        <p className="text-sm text-muted">
          Entra a tu cuenta para postular y seguir tus proyectos.
        </p>
      </div>

      <div className="mt-8">
        <LoginForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-electric hover:underline">
          Crear cuenta
        </Link>
      </p>
    </main>
  );
}
