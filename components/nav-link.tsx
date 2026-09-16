"use client";

import { useEffect, useState, type ReactNode, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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
  const hashIndex = href.indexOf("#");
  const pathPart = hashIndex >= 0 ? href.slice(0, hashIndex) || "/" : href;
  const hashPart = hashIndex >= 0 ? href.slice(hashIndex + 1) : null;

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

    // Si llegamos con hash en la URL, alinear estado inicial tras el layout.
    if (window.location.hash === `#${hashPart}`) {
      queueMicrotask(() => setHashActivo(true));
    }

    return () => obs.disconnect();
  }, [hashPart, pathPart, pathname]);

  const activo = hashPart
    ? hashActivo
    : pathname === href || (href !== "/" && pathname.startsWith(href));

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!hashPart) return;
    if (pathname !== pathPart) return;

    event.preventDefault();
    const el = document.getElementById(hashPart);
    if (!el) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    window.history.pushState(null, "", `#${hashPart}`);
  }

  return (
    <Link
      href={href}
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
