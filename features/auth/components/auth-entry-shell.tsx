"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel";
import { AuthFormPanel } from "@/features/auth/components/auth-form-panel";
import { AuthRolProvider } from "@/features/auth/components/auth-rol-context";
import { AuthSplitFrame } from "@/features/auth/components/auth-split-frame";

const EASE = [0.22, 1, 0.36, 1] as const;

function AuthEntryShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <AuthSplitFrame>
      <AuthBrandPanel />

      <AuthFormPanel>
        {/* Solo opacidad: el layout queda montado al ir ingresar ↔ registro. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </AuthFormPanel>
    </AuthSplitFrame>
  );
}

/**
 * Shell compartido de /ingresar y /registro en pantalla completa (entrada
 * directa por URL o refresh — el modal usa `AuthModal`, no este componente):
 * panel de marca y marco oscuro permanecen montados; solo el formulario
 * cruza con fade (sin blur).
 */
export function AuthEntryShell({ children }: { children: ReactNode }) {
  return (
    <AuthRolProvider>
      <AuthEntryShellInner>{children}</AuthEntryShellInner>
    </AuthRolProvider>
  );
}
