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
  isModal = false,
}: {
  initialRol?: Rol;
  registroAbierto?: boolean;
  /**
   * true solo en la versión modal (ver AuthModal). Ahí el link a /ingresar
   * usa <Link replace> para cruzar sin apilar historial y sin salir del
   * modal. En la página completa (por defecto) usa <a> normal: los modales
   * son solo para el "frente" (landing) — una vez en la página completa de
   * auth, cruzar entre ingresar/registro debe quedarse en página completa,
   * nunca abrir un modal encima de sí misma.
   */
  isModal?: boolean;
}) {
  const { rol, setRol } = useAuthRol();

  useEffect(() => {
    setRol(initialRol);
  }, [initialRol, setRol]);

  const linkClassName = "font-medium text-electric hover:underline";
  const ingresarCorto = isModal ? (
    <Link href="/ingresar" replace className={linkClassName}>
      Ingresar
    </Link>
  ) : (
    <a href="/ingresar" className={linkClassName}>
      Ingresar
    </a>
  );
  const ingresarLargo = isModal ? (
    <Link href="/ingresar" replace className={linkClassName}>
      ingresar aquí
    </Link>
  ) : (
    <a href="/ingresar" className={linkClassName}>
      ingresar aquí
    </a>
  );

  return (
    <>
      <h2 className="text-2xl font-bold text-ink">Crea tu cuenta</h2>
      {registroAbierto ? (
        <>
          <p className="mt-1 text-sm text-muted">
            ¿Ya tienes cuenta? {ingresarCorto}
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
            Reintenta más tarde. Si ya existe una cuenta, se puede {ingresarLargo}.
          </p>
        </div>
      )}
    </>
  );
}
