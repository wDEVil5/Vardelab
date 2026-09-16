"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SignupForm, type Rol } from "@/features/auth/components/signup-form";
import { useAuthRol } from "@/features/auth/components/auth-rol-context";

/**
 * Contenido del formulario de registro. El shell de credenciales monta el
 * panel de marca; aquí solo el card derecho y el rol vía contexto.
 */
export function RegistroView({
  initialRol = "estudiante",
  registroAbierto = true,
}: {
  initialRol?: Rol;
  registroAbierto?: boolean;
}) {
  const { rol, setRol } = useAuthRol();

  useEffect(() => {
    setRol(initialRol);
  }, [initialRol, setRol]);

  return (
    <>
      <h2 className="text-2xl font-bold text-ink">Crea tu cuenta</h2>
      {registroAbierto ? (
        <>
          <p className="mt-1 text-sm text-muted">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/ingresar"
              className="font-medium text-electric hover:underline"
            >
              Ingresar
            </Link>
          </p>

          <div className="mt-6">
            <SignupForm rol={rol} onRolChange={setRol} />
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-surface p-6 text-center">
          <p className="font-semibold text-ink">
            El registro de cuentas nuevas está pausado temporalmente.
          </p>
          <p className="mt-2 text-sm text-muted">
            Reintenta más tarde. Si ya existe una cuenta, se puede{" "}
            <Link
              href="/ingresar"
              className="font-medium text-electric hover:underline"
            >
              ingresar aquí
            </Link>
            .
          </p>
        </div>
      )}
    </>
  );
}
