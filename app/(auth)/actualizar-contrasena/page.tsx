import type { Metadata } from "next";
import Link from "next/link";
import { UpdatePasswordForm } from "@/features/auth/components/update-password-form";

export const metadata: Metadata = {
  title: "Nueva contraseña · CampusLab",
};

/**
 * A-04 · Definir la nueva contraseña, tras abrir el enlace del correo de
 * recuperación (`/auth/confirm` ya dejó la sesión activa antes de llegar
 * acá). Mismo tratamiento de tarjeta única que `/recuperar`.
 */
export default function ActualizarContrasenaPage() {
  return (
    <main className="animate-fade-in relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface px-6 py-12">
      <div
        className="animate-breathe pointer-events-none absolute -top-32 left-1/2 -z-10 size-96 -translate-x-1/2 rounded-full bg-electric/15 blur-3xl"
        aria-hidden
      />

      <Link href="/" className="text-lg font-bold text-ink">
        CampusLab
      </Link>

      <div className="mt-10 w-full max-w-sm">
        <div className="rounded-3xl border border-border bg-white p-8 shadow-[0_4px_16px_-8px_rgba(13,37,59,0.12)]">
          <h1 className="text-2xl font-bold text-ink">Nueva contraseña</h1>
          <p className="mt-1 text-sm text-muted">
            Elige una contraseña para tu cuenta.
          </p>

          <div className="mt-6">
            <UpdatePasswordForm />
          </div>
        </div>
      </div>
    </main>
  );
}
