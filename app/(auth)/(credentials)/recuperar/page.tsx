import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña · Vardelab",
};

type PageProps = { searchParams: Promise<{ error?: string }> };

/**
 * A-03 · Recuperar contraseña. Se llega desde "¿Olvidaste tu contraseña?" en
 * /ingresar — vive bajo el mismo layout de credenciales (`(credentials)`)
 * que ingresar/registro para heredar el mismo marco a dos secciones, en vez
 * de la tarjeta centrada sobre gris que tenía antes (quedaba desconectada
 * del split oscuro/blanco de las otras pantallas de auth). A diferencia de
 * ingresar/registro, esta pantalla nunca se abre como modal (ver
 * login-form.tsx: el link de entrada usa <a>, no <Link>) — solo el "frente"
 * (ingresar/registro) tiene versión modal. Si `/auth/confirm` rechazó un
 * enlace vencido o inválido, redirige acá con `?error=` para explicarlo.
 */
export default async function RecuperarPage({ searchParams }: PageProps) {
  const { error } = await searchParams;

  return (
    <>
      <h2 className="text-2xl font-bold text-ink">Recuperar contraseña</h2>
      <p className="mt-1 text-sm text-muted">
        Ingresa tu correo y te mandamos un enlace para restablecerla.
      </p>

      {error && (
        <p role="alert" className="mt-4 text-sm text-coral">
          {error}
        </p>
      )}

      <div className="mt-6">
        <ForgotPasswordForm />
      </div>

      <p className="mt-6 text-sm text-muted">
        {/* <a> normal: volver a /ingresar tampoco debe abrirlo como modal. */}
        <a href="/ingresar" className="font-medium text-electric hover:underline">
          ← Volver a ingresar
        </a>
      </p>
    </>
  );
}
