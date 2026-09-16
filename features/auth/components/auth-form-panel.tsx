import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Columna derecha: misma base oscura; la tarjeta blanca concentra el form.
 * Separación visual por contraste de la tarjeta, no por una línea entre paneles.
 */
export function AuthFormPanel({
  children,
  footerNote = "Piloto independiente",
}: {
  children: ReactNode;
  footerNote?: string;
}) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12">
      <Link
        href="/"
        className="mb-8 text-[15px] font-semibold tracking-tight text-white lg:hidden"
      >
        CampusLab
      </Link>

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-white p-8 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]">
        {children}
      </div>

      <p className="relative z-10 mt-6 text-xs text-white/40">{footerNote}</p>
    </div>
  );
}
