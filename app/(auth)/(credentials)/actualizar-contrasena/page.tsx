import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/features/auth/components/update-password-form";

export const metadata: Metadata = {
  title: "Nueva contraseña · Vardelab",
};

/**
 * A-04 · Definir la nueva contraseña, tras abrir el enlace del correo de
 * recuperación (`/auth/confirm` ya dejó la sesión activa antes de llegar
 * acá). Vive bajo el mismo layout de credenciales que ingresar/registro/
 * recuperar, para heredar el mismo marco a dos secciones.
 */
export default function ActualizarContrasenaPage() {
  return (
    <>
      <h2 className="text-2xl font-bold text-ink">Nueva contraseña</h2>
      <p className="mt-1 text-sm text-muted">
        Elige una contraseña para tu cuenta.
      </p>

      <div className="mt-6">
        <UpdatePasswordForm />
      </div>
    </>
  );
}
