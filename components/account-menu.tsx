"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { signOut } from "@/features/auth/actions";
import { cn } from "@/lib/utils";
import { useIsClient } from "@/lib/use-is-client";

export type AccountMenuItem = { href: string; label: string; icon: IconName };

type IconName =
  | "perfil"
  | "inicio"
  | "proyecto"
  | "organizacion"
  | "moderacion"
  | "admin"
  | "postulaciones";

const ICONS: Record<IconName, ReactNode> = {
  perfil: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
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
 * Menú de cuenta del header. Overlay + panel van en portal al `body` (z alto)
 * para quedar delante del oscurecido y no atrapados en el stacking del header.
 */
export function AccountMenu({
  nombre,
  email,
  avatarUrl,
  initials,
  items,
  open: openProp,
  onOpenChange,
}: {
  nombre: string;
  email: string;
  avatarUrl: string | null;
  initials: string;
  items: AccountMenuItem[];
  /** Controlado: para excluir con el menú hamburguesa en móvil. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [openInternal, setOpenInternal] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? Boolean(openProp) : openInternal;
  const setOpen = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      const value = typeof next === "function" ? next(open) : next;
      if (!controlled) setOpenInternal(value);
      onOpenChange?.(value);
    },
    [open, controlled, onOpenChange],
  );
  const mounted = useIsClient();
  const [panelPos, setPanelPos] = useState<{ top: number; right: number }>({
    top: 0,
    right: 0,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function updatePos() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPanelPos({
      top: r.bottom + 8,
      right: Math.max(12, window.innerWidth - r.right),
    });
  }

  useEffect(() => {
    if (!open) return;
    updatePos();
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onReposition() {
      updatePos();
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!open) updatePos();
          setOpen((o) => !o);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Cuenta de ${nombre}`}
        className="relative z-80 flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink text-[11px] font-semibold text-white transition-opacity hover:opacity-90 lg:size-9 lg:text-xs"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-8 object-cover lg:size-9"
          />
        ) : (
          initials
        )}
      </button>

      {mounted
        ? createPortal(
            <>
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                onClick={() => setOpen(false)}
                className={cn(
                  "fixed inset-x-0 top-14 bottom-0 z-60 cursor-default bg-ink/50 backdrop-blur-[2px] transition-opacity duration-150 ease-out",
                  open ? "opacity-100" : "pointer-events-none opacity-0",
                )}
              />
              <div
                ref={panelRef}
                role="menu"
                aria-label="Cuenta"
                style={{ top: panelPos.top, right: panelPos.right }}
                className={cn(
                  "fixed z-70 w-64 rounded-2xl border border-border bg-white p-2 shadow-lg transition-opacity duration-150 ease-out",
                  open ? "opacity-100" : "pointer-events-none opacity-0",
                )}
              >
                <div className="px-3 py-2.5">
                  <p className="truncate text-sm font-semibold text-ink">
                    {nombre}
                  </p>
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
                      <path d="M15 17l5-5-5-5M20 12H9M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" />
                    </svg>
                    Cerrar sesión
                  </button>
                </form>
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
