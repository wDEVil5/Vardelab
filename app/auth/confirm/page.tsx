import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthEntryShell } from "@/features/auth/components/auth-entry-shell";
import { ConfirmEmailAuto } from "@/features/auth/components/confirm-email-auto";
import { POST_AUTH_REDIRECT } from "@/features/auth/constants";

export const metadata: Metadata = {
  title: "Confirmando cuenta · Vardelab",
};

type PageProps = { searchParams: Promise<{ code?: string; next?: string }> };

/**
 * Enlace de confirmación de Supabase Auth (registro, recuperación de
 * contraseña, cambio de correo). Antes era un Route Handler que
 * intercambiaba el `code` apenas alguien abría la URL — ver el comentario de
 * `confirmEmailCode` (features/auth/actions.ts) para por qué eso se rompía
 * con el escaneo automático de links de Gmail. Ahora es una página que le
 * delega el intercambio real a `ConfirmEmailAuto`, del lado del cliente.
 * Reusa `AuthEntryShell` (mismo panel de marca que /ingresar y /registro) en
 * vez de una pantalla en blanco, ya que es lo primero que ve alguien
 * recién registrado.
 */
export default async function ConfirmarCorreoPage({ searchParams }: PageProps) {
  const { code, next } = await searchParams;
  if (!code) redirect("/ingresar?error=El enlace no es válido o ya expiró.");

  return (
    <AuthEntryShell>
      <h2 className="text-2xl font-bold text-ink">Confirmando tu cuenta</h2>
      <p className="mt-1 text-sm text-muted">Esto solo toma un segundo.</p>
      <div className="mt-6">
        <ConfirmEmailAuto code={code} next={next ?? POST_AUTH_REDIRECT} />
      </div>
    </AuthEntryShell>
  );
}
