"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Enlace de navegación con estado activo (resalta en electric la sección
 * actual). Cliente porque necesita `usePathname`. Para "/" exige coincidencia
 * exacta; el resto marca activo también en sus subrutas.
 */
export function NavLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const activo =
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={cn(
        "text-sm transition-colors",
        activo
          ? "font-medium text-electric"
          : "text-muted hover:text-electric",
        className,
      )}
    >
      {children}
    </Link>
  );
}
