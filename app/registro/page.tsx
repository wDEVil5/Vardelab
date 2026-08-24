import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata: Metadata = {
  title: "Crear cuenta · CampusLab",
};

/** A-02 · Registro. */
export default function RegistroPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Crear cuenta</h1>
        <p className="text-sm text-muted">
          Súmate a CampusLab como estudiante o patrocinador.
        </p>
      </div>

      <div className="mt-8">
        <SignupForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/ingresar" className="font-medium text-electric hover:underline">
          Ingresar
        </Link>
      </p>
    </main>
  );
}
