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
  | "organizacion"
  | "postulaciones"
  | "moderacion"
  | "perfil";

// Iconos lineales del sidebar (se resuelven por nombre para pasar props serializables).
const ICONS: Record<IconName, ReactNode> = {
  inicio: <path d="M3 10.5L12 3l9 7.5M5 9.5V21h14V9.5" />,
  explorar: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  proyecto: <path d="M12 3l9 9-9 9-9-9 9-9z" />,
  organizacion: (
    <>
      <path d="M3 21h18M5 21V7l7-4 7 4v14" />
      <path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M10 21v-4h4v4" />
    </>
  ),
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

const CLAVE_COLAPSADO = "campuslab:sidebar-colapsado";

/**
 * Sidebar del área autenticada (route group `(app)`). En desktop es fijo y
 * colapsable: un riel de íconos que se despliega a etiquetas con el botón
 * superior; la preferencia se recuerda en localStorage. En móvil se reemplaza por
 * una barra superior con un panel lateral (drawer). Los enlaces resaltan la
 * sección activa. El cierre de sesión usa la Server Action `signOut`.
 */
export function AppSidebar({
  user,
  items,
}: {
  user: { nombre: string; initials: string; roleLabel: string };
  items: AppNavItem[];
}) {
  const [open, setOpen] = useState(false); // drawer móvil
  const [colapsado, setColapsado] = useState(false); // riel desktop
  const pathname = usePathname();

  // Restaura la preferencia de plegado (tras el primer render, para no romper
  // la hidratación: el servidor siempre pinta el riel desplegado).
  useEffect(() => {
    try {
      // Lectura única de la preferencia tras hidratar (el servidor no ve
      // localStorage): sincroniza el estado inicial, no es un bucle de render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setColapsado(localStorage.getItem(CLAVE_COLAPSADO) === "1");
    } catch {
      /* almacenamiento no disponible: se queda desplegado */
    }
  }, []);

  function alternarColapso() {
    setColapsado((v) => {
      const nuevo = !v;
      try {
        localStorage.setItem(CLAVE_COLAPSADO, nuevo ? "1" : "0");
      } catch {
        /* sin persistencia: vale solo para esta sesión */
      }
      return nuevo;
    });
  }

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

  // Contenido del sidebar. `compact` = riel plegado (solo íconos); el drawer
  // móvil siempre va desplegado.
  const contenido = (compact: boolean) => (
    <div className="flex h-full flex-col gap-4 p-3">
      {/* Cabecera: marca + botón de plegado (solo desktop). */}
      <div
        className={cn(
          "flex items-center gap-2 px-1 pt-1",
          compact ? "justify-center" : "justify-between",
        )}
      >
        {!compact && (
          <Link href="/" className="min-w-0 truncate px-1 text-lg font-bold text-white">
            CampusLab
          </Link>
        )}
        <button
          type="button"
          onClick={alternarColapso}
          aria-label={compact ? "Desplegar menú" : "Plegar menú"}
          aria-expanded={!compact}
          className="hidden size-9 shrink-0 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:flex"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {!compact && (
        <p className="px-2 text-xs text-white/50">{user.roleLabel}</p>
      )}

      {/* Tarjeta de usuario = acceso al perfil (reemplaza el ítem "Perfil"). */}
      <Link
        href="/perfil"
        aria-current={pathname === "/perfil" ? "page" : undefined}
        aria-label={compact ? `${user.nombre} · ver mi perfil` : undefined}
        title={compact ? "Ver mi perfil" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-xl transition-colors",
          compact ? "justify-center p-2" : "p-3",
          pathname === "/perfil" ? "bg-white/10" : "bg-white/5 hover:bg-white/10",
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-electric text-sm font-semibold text-white">
          {user.initials}
        </span>
        {!compact && (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {user.nombre}
              </p>
              <p className="text-xs text-white/50">Ver mi perfil</p>
            </div>
            <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-white/40" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 6l6 6-6 6" />
            </svg>
          </>
        )}
      </Link>

      {/* Separadora: identidad ↕ navegación. */}
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
              aria-label={compact ? it.label : undefined}
              title={compact ? it.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                compact ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white",
              )}
            >
              <span className={active ? "text-electric" : ""}>
                <Icon name={it.icon} />
              </span>
              {!compact && it.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-white/10 pt-3">
        <span
          className={cn(
            "flex cursor-default items-center gap-3 rounded-lg py-2.5 text-sm font-medium text-white/40",
            compact ? "justify-center px-0" : "px-3",
          )}
          title="Disponible pronto"
        >
          <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .8-1 1.7M12 17h.01" />
          </svg>
          {!compact && "Soporte"}
        </span>
        <form action={signOut}>
          <button
            type="submit"
            aria-label={compact ? "Cerrar sesión" : undefined}
            title={compact ? "Cerrar sesión" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white",
              compact ? "justify-center px-0" : "px-3",
            )}
          >
            <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 17l5-5-5-5M20 12H9M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" />
            </svg>
            {!compact && "Cerrar sesión"}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar fijo (desktop): ancho animado según el estado de plegado. */}
      <aside
        className={cn(
          "hidden shrink-0 transition-[width] duration-200 ease-out lg:block",
          colapsado ? "w-20" : "w-64",
        )}
      >
        <div className="sticky top-0 h-dvh overflow-y-auto overflow-x-hidden rounded-r-3xl bg-ink">
          {contenido(colapsado)}
        </div>
      </aside>

      {/* Barra superior (móvil). */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-white px-4 py-3 lg:hidden">
        <Link href="/" className="font-bold text-ink">
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
            {contenido(false)}
          </div>
        </>
      )}
    </>
  );
}
