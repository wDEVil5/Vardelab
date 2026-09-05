"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/features/auth/actions";

export type AppNavItem = { href: string; label: string; icon: IconName };

type IconName =
  | "inicio"
  | "explorar"
  | "proyecto"
  | "postulaciones"
  | "moderacion"
  | "perfil";

// Iconos lineales del sidebar (se resuelven por nombre para pasar props serializables).
const ICONS: Record<IconName, ReactNode> = {
  inicio: <path d="M3 10.5L12 3l9 7.5M5 9.5V21h14V9.5" />,
  explorar: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  proyecto: <path d="M12 3l9 9-9 9-9-9 9-9z" />,
  postulaciones: <><path d="M4 6h16M4 12h16M4 18h10" /></>,
  moderacion: <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z" />,
  perfil: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
};

function Icon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {ICONS[name]}
    </svg>
  );
}

/**
 * Sidebar del área autenticada (route group `(app)`). Fijo en desktop; en móvil
 * se reemplaza por una barra superior con un panel lateral (drawer). Los enlaces
 * resaltan la sección activa. El cierre de sesión usa la Server Action `signOut`.
 */
export function AppSidebar({
  user,
  items,
}: {
  user: { nombre: string; initials: string; roleLabel: string };
  items: AppNavItem[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cierra el drawer al navegar (patrón render-phase, sin setState en effect).
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Contenido compartido por el sidebar de desktop y el drawer móvil.
  const contenido = (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 pt-2">
        <Link href="/inicio" className="text-xl font-bold text-white">
          CampusLab
        </Link>
        <p className="mt-0.5 text-xs text-white/50">{user.roleLabel}</p>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-electric text-sm font-semibold text-white">
          {user.initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {user.nombre}
          </p>
          <p className="text-xs text-white/50">{user.roleLabel}</p>
        </div>
      </div>

      {/* Primera línea separadora: bloque de identidad ↕ navegación. */}
      <div className="h-px bg-white/10" />

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((it) => {
          const active =
            pathname === it.href ||
            (it.href !== "/" && pathname.startsWith(it.href));
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white",
              )}
            >
              <span className={active ? "text-electric" : ""}>
                <Icon name={it.icon} />
              </span>
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-white/10 pt-3">
        <span
          className="flex cursor-default items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/40"
          title="Disponible pronto"
        >
          <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .8-1 1.7M12 17h.01" />
          </svg>
          Soporte
        </span>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 17l5-5-5-5M20 12H9M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" />
            </svg>
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar fijo (desktop): pegado al borde, redondeado del lado interior. */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-0 h-dvh overflow-y-auto rounded-r-3xl bg-ink">
          {contenido}
        </div>
      </aside>

      {/* Barra superior (móvil). */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-white px-4 py-3 lg:hidden">
        <Link href="/inicio" className="font-bold text-ink">
          CampusLab
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="flex size-9 items-center justify-center rounded-md text-ink hover:bg-surface"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>

      {/* Drawer (móvil). */}
      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-ink/40 lg:hidden"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85%] overflow-y-auto bg-ink lg:hidden">
            {contenido}
          </div>
        </>
      )}
    </>
  );
}
