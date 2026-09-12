"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { signOut } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

export type AccountMenuItem = { href: string; label: string; icon: IconName };

type IconName = "perfil" | "inicio" | "proyecto" | "organizacion" | "moderacion" | "admin" | "postulaciones";

// Mismos trazos que ya usa `AppSidebar`, para que el menú de cuenta del sitio
// público se sienta parte del mismo sistema que el panel privado.
const ICONS: Record<IconName, ReactNode> = {
  perfil: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  inicio: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </>
  ),
  proyecto: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M9 4.5v15M15 4.5v15" />
    </>
  ),
  organizacion: (
    <>
      <path d="M3 21h18M5 21V7l7-4 7 4v14" />
      <path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M10 21v-4h4v4" />
    </>
  ),
  moderacion: <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z" />,
  admin: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="17" cy="6" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="14" cy="18" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  postulaciones: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4V3.5a1 1 0 011-1h4a1 1 0 011 1V4" />
      <path d="M9 12.5l2 2 4-4.5" />
    </>
  ),
};

function Icon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 shrink-0 text-muted"
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
 * Menú desplegable de cuenta en el header del sitio público: al hacer clic en
 * el avatar, en vez de ir directo a `/perfil`, se abre un panel con los
 * destinos según el rol (el que arma `SiteHeader`) y cerrar sesión. Se cierra
 * al elegir una opción, tocar fuera o con Escape. Panel siempre montado (no
 * condicional): la transición de opacidad/escala es lo que lo muestra u
 * oculta, para que abrir y cerrar se sientan animados y no un salto brusco.
 */
export function AccountMenu({
  nombre,
  email,
  avatarUrl,
  initials,
  items,
}: {
  nombre: string;
  email: string;
  avatarUrl: string | null;
  initials: string;
  items: AccountMenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Cuenta de ${nombre}`}
        className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="size-9 object-cover" />
        ) : (
          initials
        )}
      </button>

      <div
        role="menu"
        aria-label="Cuenta"
        className={cn(
          "absolute top-full right-0 z-50 mt-2 w-64 rounded-2xl border border-border bg-white p-2 shadow-lg transition-opacity duration-150 ease-out",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="px-3 py-2.5">
          <p className="truncate text-sm font-semibold text-ink">{nombre}</p>
          <p className="truncate text-xs text-muted">{email}</p>
        </div>

        <div className="my-1 h-px bg-border" />

        <nav className="flex flex-col gap-0.5">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink transition-colors hover:bg-surface"
            >
              <Icon name={it.icon} />
              {it.label}
            </Link>
          ))}
        </nav>

        <div className="my-1 h-px bg-border" />

        <form action={signOut}>
          <button
            type="submit"
            role="menuitem"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-surface"
          >
            <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 17l5-5-5-5M20 12H9M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" />
            </svg>
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
