"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { useModalBehavior } from "@/components/ui/use-modal-behavior";
import { completeModeradorIntro } from "@/features/profile/actions";

// Cuánto se queda la animación de cierre en pantalla antes de empezar a
// desvanecerse.
const DURACION_EXITO_MS = 1600;
// Duración del fundido de salida: hasta que termina, no se refresca el
// layout, así la desaparición es un fundido, no un corte.
const DURACION_SALIDA_S = 0.45;

// Los tres puntos calzan 1:1 con lo que el nav de moderador realmente
// habilita (ver la construcción de `items` en app/(app)/layout.tsx):
// Moderación, Moderación > Reportes y Leads. Nada inventado.
const RESPONSABILIDADES = [
  "Revisas los proyectos antes de que se publiquen",
  "Atiendes los reportes de proyectos, perfiles y organizaciones",
  "Das seguimiento a los leads de \"Hablar con Vardelab\" y \"Proponer un desafío\"",
];

/**
 * Pantalla informativa al pasar a moderador (M88): un solo paso, sin datos
 * que llenar, solo contexto del rol. Mismos principios que el onboarding de
 * estudiante (M87): no se cierra con Escape ni clic afuera, termina con una
 * animación de cierre en vez de desaparecer de un corte, y `pointer-events`
 * se desactiva al empezar a salir por si `router.refresh()` tardara.
 */
export function ModeratorIntro() {
  const [fase, setFase] = useState<"info" | "exito">("info");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [saliendo, setSaliendo] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const router = useRouter();

  useModalBehavior({ open: true, onClose: () => {}, containerRef });

  async function comenzar() {
    setEnviando(true);
    setError("");
    const result = await completeModeradorIntro();
    setEnviando(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setFase("exito");
    setTimeout(() => setSaliendo(true), DURACION_EXITO_MS);
  }

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-md ${saliendo ? "pointer-events-none" : ""}`}
      animate={{ opacity: saliendo ? 0 : 1 }}
      transition={{ duration: reduceMotion ? 0 : DURACION_SALIDA_S, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => {
        if (saliendo) router.refresh();
      }}
    >
      <motion.div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="moderador-intro-titulo"
        tabIndex={-1}
        initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: saliendo ? 0.97 : 1 }}
        transition={{
          duration: reduceMotion ? 0 : saliendo ? DURACION_SALIDA_S : 0.25,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-4xl bg-white shadow-[0_40px_100px_-24px_rgba(13,37,59,0.5)] focus:outline-none"
      >
        {fase === "exito" ? (
          <PantallaExito />
        ) : (
          <div className="px-10 py-14 sm:px-16 sm:py-20">
            <h2 id="moderador-intro-titulo" className="text-3xl font-bold tracking-tight text-ink">
              Bienvenido a moderación
            </h2>
            <p className="mt-3 max-w-md text-base leading-relaxed text-muted">
              Ahora tienes acceso al panel de moderación. Antes de entrar, esto es lo
              que hace un moderador en Vardelab.
            </p>

            <ul className="mt-8 flex flex-col gap-2.5">
              {RESPONSABILIDADES.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-ink">
                  <span className="size-1.5 shrink-0 rounded-full bg-electric" />
                  {item}
                </li>
              ))}
            </ul>

            {error && (
              <p role="alert" className="mt-4 text-sm text-coral">
                {error}
              </p>
            )}

            <div className="mt-10 flex justify-end">
              <button
                type="button"
                onClick={comenzar}
                disabled={enviando}
                className="h-12 rounded-2xl bg-electric px-7 text-sm font-semibold text-white shadow-[0_10px_24px_-8px_rgba(37,99,235,0.55)] transition-transform hover:bg-electric/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
              >
                {enviando ? "Un momento…" : "Entendido, comenzar"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/** Pantalla de cierre: check animado, se queda `DURACION_EXITO_MS` antes de que arranque el fundido de salida. */
function PantallaExito() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="flex flex-col items-center px-10 py-20 text-center sm:px-16 sm:py-28">
      <motion.span
        initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex size-20 items-center justify-center rounded-full bg-sprout/15 text-sprout"
      >
        <svg viewBox="0 0 24 24" className="size-10" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <motion.path
            d="M5 13l4 4L19 7"
            initial={reduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          />
        </svg>
      </motion.span>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <h2 className="mt-7 text-2xl font-bold text-ink">¡Listo!</h2>
        <p className="mt-2 text-base text-muted">Te llevamos a tu panel de moderación.</p>
      </motion.div>
    </div>
  );
}
