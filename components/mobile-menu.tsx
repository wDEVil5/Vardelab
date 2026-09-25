"use client";

import { useCallback, useEffect, useId, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsClient } from "@/lib/use-is-client";
import { resolveSectionHref, scrollToSection } from "@/lib/section-navigation";

export type MobileNavItem = { href: string; label: string };

/** Activo solo en la ruta exacta o en subrutas (`/proyectos/id`), nunca en `/`. */
function isRouteActive(pathname: string, href: string) {
  if (!href || href.includes("#")) return false;
  if (pathname === href) return true;
  if (href === "/") return false;
  return pathname.startsWith(`${href}/`);
}

/**
 * Menú móvil (hamburguesa). Visible bajo `lg`. Drawer flotante tipo popup
 * anclado arriba a la derecha (junto al botón), con overlay; Con sesión, la cuenta (panel / logout) vive en el avatar;
 * aquí solo queda la nav pública. Cierra al navegar, tocar fuera o Escape. Anclas (`/#como-funciona`) solo activas
 * mientras la sección está en viewport.
 */
export function MobileMenu({
  items,
  userName,
  open: openProp,
  onOpenChange,
}: {
  items: MobileNavItem[];
  userName: string | null;
  /** Controlado: para excluir con el menú del avatar en móvil. */
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
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const panelId = useId();

  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const durationIn = reduceMotion ? 0 : 0.18;
  // Misma duración de salida en panel y overlay para que el oscurecido no se desfase.
  const durationOut = reduceMotion ? 0 : 0.16;

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="relative z-50 flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-surface"
      >
        <span className="relative size-5" aria-hidden>
          <motion.span
            className="absolute top-2.25 left-0 h-0.5 w-5 rounded-full bg-current"
            animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -5 }}
            transition={{ duration: durationIn, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.span
            className="absolute top-2.25 left-0 h-0.5 w-5 rounded-full bg-current"
            animate={
              open ? { opacity: 0, scaleX: 0.5 } : { opacity: 1, scaleX: 1 }
            }
            transition={{ duration: durationIn * 0.85 }}
          />
          <motion.span
            className="absolute top-2.25 left-0 h-0.5 w-5 rounded-full bg-current"
            animate={open ? { rotate: -45, y: 0 } : { rotate: 0, y: 5 }}
            transition={{ duration: durationIn, ease: [0.22, 1, 0.36, 1] }}
          />
        </span>
      </button>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <>
                  <motion.button
                    key="overlay"
                    type="button"
                    aria-hidden
                    tabIndex={-1}
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: durationOut }}
                    onClick={() => setOpen(false)}
                    className="fixed inset-x-0 top-14 bottom-0 z-60 cursor-default bg-ink/50 backdrop-blur-[2px]"
                  />
                  <motion.div
                    key="panel"
                    id={panelId}
                    tabIndex={-1}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Menú"
                    initial={
                      reduceMotion
                        ? false
                        : { opacity: 0, y: -8, scale: 0.98 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{
                      opacity: 0,
                      transition: { duration: durationOut },
                    }}
                    transition={{
                      duration: durationIn,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="fixed top-17 right-3 z-70 w-[min(20.5rem,calc(100vw-1.5rem))] origin-top-right"
                  >
                    <div className="overflow-hidden rounded-2xl border border-border bg-white p-2 shadow-[0_20px_50px_-20px_rgba(13,37,59,0.45)]">
                      <nav
                        aria-label="Principal"
                        className="flex flex-col gap-0.5"
                      >
                        {items.map((it, i) => (
                          <MobileNavLink
                            key={it.href}
                            item={it}
                            pathname={pathname}
                            index={i}
                            reduceMotion={Boolean(reduceMotion)}
                            onNavigate={() => setOpen(false)}
                          />
                        ))}

                        {!userName ? (
                        <div className="mt-1 border-t border-border px-1 pt-2 pb-1">
                          <div className="flex flex-col gap-3 px-1 pb-1 pt-0.5">
                            <Link
                              href="/ingresar"
                              onClick={() => setOpen(false)}
                              className={cn(
                                buttonClasses({ variant: "primary" }),
                                "h-11 w-full justify-center text-sm",
                              )}
                            >
                              Iniciar sesión
                            </Link>
                            <p className="text-center text-sm text-muted">
                              ¿No tienes cuenta?{" "}
                              <Link
                                href="/registro"
                                onClick={() => setOpen(false)}
                                className="font-medium text-electric transition-colors hover:text-electric/80"
                              >
                                Regístrate
                              </Link>
                            </p>
                          </div>
                        </div>
                      ) : null}
                      </nav>
                    </div>
                  </motion.div>
                </>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}

function MobileNavLink({
  item,
  pathname,
  index,
  reduceMotion,
  onNavigate,
}: {
  item: MobileNavItem;
  pathname: string;
  index: number;
  reduceMotion: boolean;
  onNavigate: () => void;
}) {
  const resolvedHref = resolveSectionHref(item.href, pathname);
  const hashIndex = resolvedHref.indexOf("#");
  const pathPart =
    hashIndex >= 0 ? resolvedHref.slice(0, hashIndex) || "/" : resolvedHref;
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

    const obs = new IntersectionObserver(
      ([entry]) => setHashActivo(entry.isIntersecting),
      { rootMargin: "-20% 0px -55% 0px", threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hashPart, pathPart, pathname]);

  const activo = hashPart ? hashActivo : isRouteActive(pathname, item.href);

  function onNavClick(event: MouseEvent<HTMLAnchorElement>) {
    if (hashPart && pathname === pathPart && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      onNavigate();
      requestAnimationFrame(() => {
        scrollToSection(hashPart);
      });
      return;
    }
    onNavigate();
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.18,
        delay: reduceMotion ? 0 : 0.04 + index * 0.03,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link
        href={resolvedHref}
        onClick={onNavClick}
        aria-current={activo ? "page" : undefined}
        className={cn(
          "flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-electric/35",
          activo
            ? "bg-electric/10 text-electric"
            : "text-ink hover:bg-surface",
        )}
      >
        {item.label}
      </Link>
    </motion.div>
  );
}
