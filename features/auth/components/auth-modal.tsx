"use client";

import { useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useModalBehavior } from "@/components/ui/use-modal-behavior";
import { AuthImagePanel } from "@/features/auth/components/auth-image-panel";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Modal de ingresar/registro sobre la página de fondo (intercepting route de
 * Next.js: `app/@modal/(auth-modal)/(.)ingresar` y `(.)registro`, que
 * comparten `layout.tsx` — este componente se monta ahí, no en cada page, así
 * que NO se remonta al pasar de ingresar a registro: solo cambia `children`.
 * Eso es lo que permite cruzar el contenido con fade (en vez de reemplazarlo
 * de golpe) y animar el swap de lado entre el formulario y el panel de la
 * imagen (`layout="position"` + `order`). La tarjeta tiene un alto fijo
 * (pensado para el formulario de registro, el más largo); el de ingresar,
 * más corto, se centra verticalmente en ese mismo espacio en vez de animarse
 * — así ambas pantallas comparten tamaño y el cambio no se siente brusco.
 *
 * Navegar hacia /ingresar o /registro con <Link> desde dentro de la app cae
 * acá, encima de lo que ya estaba en pantalla; entrar directo por URL o
 * refrescar la página usa el fallback de página completa en `app/(auth)`.
 * Cerrar hace `router.back()` — los links que cruzan entre ingresar y
 * registro usan `replace` para no apilar historial, así cerrar siempre
 * vuelve de un salto a la página de fondo, sin importar cuántas veces se
 * haya cruzado entre ambos formularios.
 */
export function AuthModal({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isRegistro = pathname === "/registro";
  const close = () => router.back();
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useModalBehavior({ open: true, onClose: close, containerRef: dialogRef });

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[8vh] lg:items-center lg:pt-4">
      <motion.button
        type="button"
        aria-label="Cerrar"
        onClick={close}
        tabIndex={-1}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduce ? 0 : 0.18, ease: "easeOut" }}
        className="absolute inset-0 cursor-default bg-ink/50 backdrop-blur-sm"
      />

      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Acceso a Vardelab"
        tabIndex={-1}
        layout={reduce ? false : "size"}
        initial={{ opacity: 0, y: reduce ? 0 : 12, scale: reduce ? 1 : 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduce ? 0 : 0.2, ease: EASE }}
        className="relative z-10 flex max-h-[90dvh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_-20px_rgba(0,0,0,0.55)] focus:outline-none lg:h-160 lg:max-w-4xl"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-20 flex size-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition-colors hover:bg-white"
        >
          <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <motion.div
          layout={reduce ? false : "position"}
          transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}
          className={cn(
            "flex w-full flex-col justify-center overflow-y-auto px-6 py-10 sm:px-10 lg:w-[52%] lg:shrink-0",
            isRegistro ? "order-2" : "order-1",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="mx-auto w-full max-w-sm lg:max-w-none"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Lado de la imagen: cambia de lado con el formulario (order) al
            cruzar ingresar ↔ registro — Framer anima el swap solo
            (layout="position"). Mismo panel que la pantalla completa
            (AuthImagePanel), así se ven idénticos. */}
        <motion.div
          layout={reduce ? false : "position"}
          transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}
          className={cn(
            "hidden flex-1 lg:block",
            isRegistro ? "order-1" : "order-2",
          )}
        >
          <AuthImagePanel />
        </motion.div>
      </motion.div>
    </div>,
    document.body,
  );
}
