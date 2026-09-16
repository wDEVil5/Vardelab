"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useIsClient } from "@/lib/use-is-client";

type TipPos = { top: number; left: number };

const TIP_BASE =
  "pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-white shadow-sm transition-opacity duration-100 ease-out";

function useFixedTooltip() {
  const tipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const hideTimer = useRef<number>(0);
  const mounted = useIsClient();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [pos, setPos] = useState<TipPos | null>(null);

  function updatePos() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const next = { top: r.top - 6, left: r.left + r.width / 2 };
    setPos((prev) =>
      prev && prev.top === next.top && prev.left === next.left ? prev : next,
    );
  }

  function show() {
    window.clearTimeout(hideTimer.current);
    updatePos();
    setOpen(true);
  }

  function hide() {
    setShown(false);
    window.clearTimeout(hideTimer.current);
    // Un poco menos que la transición para desmontar apenas termina el fade.
    hideTimer.current = window.setTimeout(() => setOpen(false), 100);
  }

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => setShown(false));
      return;
    }
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePos();
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  const tipClass = cn(TIP_BASE, shown ? "opacity-100" : "opacity-0");

  return {
    triggerRef,
    tip: {
      tipId,
      mounted,
      open,
      pos,
      tipClass,
      show,
      hide,
    },
  };
}

/**
 * Sello de organización verificada. Tooltip arriba en portal fixed (no lo
 * corta overflow), con fade corto al entrar/salir.
 */
export function VerifiedBadge({ className }: { className?: string }) {
  const { triggerRef, tip } = useFixedTooltip();

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex shrink-0"
      tabIndex={0}
      aria-describedby={tip.open ? tip.tipId : undefined}
      onMouseEnter={tip.show}
      onMouseLeave={tip.hide}
      onFocus={tip.show}
      onBlur={tip.hide}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        role="img"
        aria-label="Organización verificada"
        className={cn("size-4 shrink-0 text-electric", className)}
      >
        <path
          fillRule="evenodd"
          d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
          clipRule="evenodd"
        />
      </svg>
      {tip.mounted &&
        tip.open &&
        tip.pos &&
        createPortal(
          <span
            id={tip.tipId}
            role="tooltip"
            className={tip.tipClass}
            style={{ top: tip.pos.top, left: tip.pos.left }}
          >
            Verificado
          </span>,
          document.body,
        )}
    </span>
  );
}

/**
 * Marcador de "todavía no verificada" (M62). Mismo tooltip arriba con fade corto.
 */
export function PendingVerificationBadge({
  className,
  estado,
}: {
  className?: string;
  estado: "sin_verificar" | "en_revision";
}) {
  const { triggerRef, tip } = useFixedTooltip();
  const label =
    estado === "en_revision" ? "Verificación en revisión" : "Sin verificar";

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex shrink-0"
      tabIndex={0}
      aria-describedby={tip.open ? tip.tipId : undefined}
      onMouseEnter={tip.show}
      onMouseLeave={tip.hide}
      onFocus={tip.show}
      onBlur={tip.hide}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        role="img"
        aria-label={label}
        className={cn("size-4 shrink-0 text-muted", className)}
      >
        <path
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2 2.1"
          d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
        />
      </svg>
      {tip.mounted &&
        tip.open &&
        tip.pos &&
        createPortal(
          <span
            id={tip.tipId}
            role="tooltip"
            className={tip.tipClass}
            style={{ top: tip.pos.top, left: tip.pos.left }}
          >
            {label}
          </span>,
          document.body,
        )}
    </span>
  );
}
