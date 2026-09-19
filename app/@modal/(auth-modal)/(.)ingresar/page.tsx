import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";
import { safeNextPath } from "@/features/auth/constants";

/**
 * Versión modal de /ingresar (intercepting route): se activa al navegar acá
 * con <Link> desde otra página de la app. El marco del modal vive en
 * layout.tsx (persiste al cruzar a /registro); acá solo el contenido. El
 * fallback de página completa vive en app/(auth)/(credentials)/ingresar
 * (entrada directa o refresh).
 */
type PageProps = { searchParams: Promise<{ error?: string; next?: string }> };

export default async function IngresarModal({ searchParams }: PageProps) {
  const { error, next } = await searchParams;

  return (
    <>
      <h2 className="text-2xl font-bold text-ink">Ingresar</h2>
      <p className="mt-1 text-sm text-muted">
        ¿Aún no tienes cuenta?{" "}
        {/* replace: si no, cerrar desde /registro solo vuelve a este modal
            en vez de a la página de fondo (ver AuthModal). */}
        <Link href="/registro" replace className="font-medium text-electric hover:underline">
          Crear cuenta
        </Link>
      </p>

      {error && (
        <p role="alert" className="mt-4 text-sm text-coral">
          {error}
        </p>
      )}

      <div className="mt-6">
        <LoginForm redirectTo={safeNextPath(next)} />
      </div>
    </>
  );
}
