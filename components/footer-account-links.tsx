"use client";

import Link from "next/link";
import { useAuthUser } from "@/features/auth/components/auth-user-context";

/**
 * Enlaces de cuenta del footer. Cliente (como SiteAuthStatus) para no forzar
 * las landings a dinámicas. Con sesión: "Ir a mi panel". Sin sesión: entrar /
 * registrarse. La sesión viene de `AuthUserProvider` (compartida con el
 * header, sin un segundo round-trip a Supabase).
 */
export function FooterAccountLinks() {
  const { user, loading } = useAuthUser();
  const logueado = loading ? null : Boolean(user);

  const linkClass =
    "text-white/70 transition-colors hover:text-white";

  if (logueado === null) {
    return (
      <div className="flex flex-col gap-2.5" aria-hidden>
        <span className="h-4 w-24 animate-pulse rounded bg-white/10" />
        <span className="h-4 w-20 animate-pulse rounded bg-white/10" />
      </div>
    );
  }

  if (logueado) {
    return (
      <Link href="/inicio" className={linkClass}>
        Ir a mi panel
      </Link>
    );
  }

  return (
    <>
      <Link href="/ingresar" className={linkClass}>
        Iniciar sesión
      </Link>
      <Link href="/registro" className={linkClass}>
        Registrarse
      </Link>
    </>
  );
}
