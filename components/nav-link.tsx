"use client";

import { useEffect, useState, type ReactNode, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { resolveSectionHref, scrollToSection } from "@/lib/section-navigation";

/**
 * Enlace de navegación con estado activo (resalta en electric la sección
 * actual). Cliente porque necesita `usePathname`. Para "/" exige coincidencia
 * exacta; el resto marca activo también en sus subrutas.
 *
 * Anclas (`/#como-funciona`):
 * - click en la misma ruta → scroll suave
 * - activo solo mientras esa sección está en viewport (scroll spy)
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
  const resolvedHref = resolveSectionHref(href, pathname);
  const hashIndex = resolvedHref.indexOf("#");
  const pathPart = hashIndex >= 0 ? resolvedHref.slice(0, hashIndex) || "/" : resolvedHref;
  const hashPart = hashIndex >= 0 ? resolvedHref.slice(hashIndex + 1) : null;

  const [hashActivo, setHashActivo] = useState(false);

  useEffect(() => {
    if (!hashPart || pathname !== pathPart) {
      queueMicrotask(() => setHashActivo(false));
      return;
    }

    const el = document.getElementById(hashPart);
    if (!el || typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => setHashActivo(false));
      return;
    }

    // Activo cuando la sección ocupa una franja útil bajo el header sticky.
    const obs = new IntersectionObserver(
      ([entry]) => {
        setHashActivo(entry.isIntersecting);
      },
      {
        // Compensa el header (~3.5–4rem) y evita que se active demasiado arriba.
        rootMargin: "-20% 0px -55% 0px",
        threshold: 0,
      },
    );
    obs.observe(el);

    // En una navegación entre rutas Next puede dejar el hash en la URL sin
    // desplazar la página. Esperar a que termine de montar el destino.
    let initialScrollTimer: number | undefined;
    if (window.location.hash === `#${hashPart}`) {
      queueMicrotask(() => setHashActivo(true));
      initialScrollTimer = window.setTimeout(() => scrollToSection(hashPart), 120);
    }

    return () => {
      obs.disconnect();
      if (initialScrollTimer) window.clearTimeout(initialScrollTimer);
    };
  }, [hashPart, pathPart, pathname]);

  const activo = hashPart
    ? hashActivo
    : pathname === href || (href !== "/" && pathname.startsWith(href));

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!hashPart || pathname !== pathPart || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    scrollToSection(hashPart);
  }

  return (
    <Link
      href={resolvedHref}
      onClick={handleClick}
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
