"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";

export type MobileNavItem = { href: string; label: string };

/**
 * Menú de navegación móvil (hamburguesa). Se muestra solo en pantallas chicas;
 * abre un panel con los enlaces y la acción de sesión. Cierra al navegar, al
 * tocar fuera (overlay) o con Escape.
 */
export function MobileMenu({
  items,
  userName,
}: {
  items: MobileNavItem[];
  userName: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cierra al cambiar de ruta (patrón de React: ajustar estado en render
  // comparando con el valor previo, sin un effect con setState).
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setOpen(false);
  }

  // Cierra con Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-surface"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {open && (
        <>
          {/* Overlay para cerrar al tocar fuera. */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-14 z-40 cursor-default bg-ink/20"
          />
          <div className="absolute inset-x-0 top-full z-50 border-b border-border bg-white shadow-sm">
            <nav className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-6 py-4">
              {items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className="rounded-md px-2 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface"
                >
                  {it.label}
                </Link>
              ))}

              <div className="mt-2 border-t border-border pt-3">
                {userName ? (
                  <form action={signOut}>
                    <button
                      type="submit"
                      className={buttonClasses({ variant: "ghost", size: "sm" })}
                    >
                      Cerrar sesión
                    </button>
                  </form>
                ) : (
                  <Link
                    href="/ingresar"
                    className={buttonClasses({ variant: "primary", size: "sm" })}
                  >
                    Acceder
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
