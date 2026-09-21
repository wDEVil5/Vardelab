"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useModalBehavior } from "@/components/ui/use-modal-behavior";
import { completeSponsorOnboarding, skipOnboarding } from "@/features/profile/actions";

const TOTAL_PASOS = 3;
// Cuánto se queda la animación de cierre en pantalla antes de empezar a
// desvanecerse.
const DURACION_EXITO_MS = 1600;
// Duración del fundido de salida: hasta que termina, no se refresca el
// layout, así la desaparición es un fundido, no un corte.
const DURACION_SALIDA_S = 0.45;

/**
 * Onboarding de patrocinador tras registrarse (M89): mismo mecanismo que
 * `OnboardingWizard` (M87) — bienvenida, pasos con una sola barra de
 * progreso continua, pantalla de cierre animada — con campos de
 * patrocinador (cargo, presentación, tipo de proyectos, enlaces) en vez de
 * los de estudiante (carrera/semestre/habilidades). Estos datos se muestran
 * después en "Quién está detrás" de la ficha pública de la organización y
 * en `/u/[id]` si el perfil se hace público. La creación de la organización
 * en sí (nombre, sector, sitio, logo) ya tiene su propio flujo en
 * /mis-organizaciones; esto es sobre la persona, no la organización. No se
 * puede cerrar con Escape ni clic afuera; "Omitir por ahora" es la única
 * salida sin completarlo.
 */
export function SponsorOnboardingWizard() {
  const [fase, setFase] = useState<"bienvenida" | "form" | "exito">("bienvenida");
  const [paso, setPaso] = useState(1);
  const [dir, setDir] = useState(1);
  const [cargo, setCargo] = useState("");
  const [bio, setBio] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [sitio, setSitio] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [skipping, setSkipping] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const router = useRouter();

  useModalBehavior({ open: true, onClose: () => {}, containerRef });

  function siguiente() {
    setDir(1);
    setPaso((p) => Math.min(TOTAL_PASOS, p + 1));
  }

  function atras() {
    setDir(-1);
    setPaso((p) => Math.max(1, p - 1));
  }

  async function finalizar() {
    setGuardando(true);
    setError("");
    const result = await completeSponsorOnboarding({ cargo, bio, linkedin, sitio });
    setGuardando(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setFase("exito");
    setTimeout(() => setSaliendo(true), DURACION_EXITO_MS);
  }

  async function omitir() {
    setSkipping(true);
    setError("");
    const result = await skipOnboarding();
    if (result.error) {
      setSkipping(false);
      setError(result.error);
      // La pantalla de bienvenida no tiene dónde mostrar el error; el paso
      // del formulario sí (ver más abajo), así que el fallo cae ahí.
      setFase("form");
    }
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
        aria-labelledby="sponsor-onboarding-titulo"
        tabIndex={-1}
        initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: saliendo ? 0.97 : 1 }}
        transition={{
          duration: reduceMotion ? 0 : saliendo ? DURACION_SALIDA_S : 0.25,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-4xl bg-white shadow-[0_40px_100px_-24px_rgba(13,37,59,0.5)] focus:outline-none"
      >
        {fase === "bienvenida" ? (
          <PantallaBienvenida onComenzar={() => setFase("form")} onOmitir={omitir} skipping={skipping} />
        ) : fase === "exito" ? (
          <PantallaExito />
        ) : (
          <>
            <div className="px-10 pt-10 sm:px-16 sm:pt-14">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-electric transition-[width] duration-300 ease-out"
                  style={{ width: `${(paso / TOTAL_PASOS) * 100}%` }}
                />
              </div>
            </div>

            <div className="overflow-y-auto px-10 py-10 sm:px-16 sm:py-12">
              <div className="relative min-h-88 sm:min-h-96">
                <AnimatePresence mode="wait" initial={false}>
                  {paso === 1 && (
                    <Paso key={1} dir={dir} reduceMotion={reduceMotion}>
                      <h2 id="sponsor-onboarding-titulo" className="text-3xl font-bold tracking-tight text-ink">
                        ¿Cuál es tu cargo?
                      </h2>
                      <p className="mt-3 max-w-md text-base leading-relaxed text-muted">
                        Ayuda a los estudiantes a saber con quién están hablando antes de
                        postular. Es opcional, puedes dejarlo en blanco y completarlo más tarde.
                      </p>

                      <div className="mt-10">
                        <Input
                          autoFocus
                          value={cargo}
                          onChange={(e) => setCargo(e.target.value)}
                          placeholder="Ej: Directora de RR.HH., Fundador, Líder de proyecto…"
                          className="h-14 rounded-2xl px-5 text-base"
                        />
                      </div>
                    </Paso>
                  )}

                  {paso === 2 && (
                    <Paso key={2} dir={dir} reduceMotion={reduceMotion}>
                      <h2 className="text-3xl font-bold tracking-tight text-ink">
                        Preséntate ante los estudiantes
                      </h2>
                      <p className="mt-3 max-w-md text-base leading-relaxed text-muted">
                        Unas líneas sobre ti y tu organización generan más confianza que un
                        logo solo. Es lo primero que un estudiante lee antes de postular.
                      </p>

                      <div className="mt-10">
                        <Textarea
                          autoFocus
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="En pocas palabras, quién eres y qué hace tu organización…"
                          className="min-h-40 rounded-2xl px-5 py-4 text-base"
                        />
                      </div>
                    </Paso>
                  )}

                  {paso === 3 && (
                    <Paso key={3} dir={dir} reduceMotion={reduceMotion}>
                      <h2 className="text-3xl font-bold tracking-tight text-ink">
                        Tus enlaces profesionales
                      </h2>
                      <p className="mt-3 max-w-md text-base leading-relaxed text-muted">
                        Un perfil de LinkedIn o un sitio propio le dan a los estudiantes una
                        forma de conocerte mejor antes de postular. Ambos opcionales.
                      </p>

                      <div className="mt-10 flex flex-col gap-4">
                        <Input
                          autoFocus
                          type="url"
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          placeholder="https://linkedin.com/in/tu-perfil"
                          className="h-14 rounded-2xl px-5 text-base"
                        />
                        <Input
                          type="url"
                          value={sitio}
                          onChange={(e) => setSitio(e.target.value)}
                          placeholder="https://tu-sitio.cl"
                          className="h-14 rounded-2xl px-5 text-base"
                        />
                      </div>

                      {error && (
                        <p role="alert" className="mt-4 text-sm text-coral">
                          {error}
                        </p>
                      )}
                    </Paso>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-10 pb-10 sm:px-16 sm:pb-14">
              <button
                type="button"
                onClick={omitir}
                disabled={skipping || guardando}
                className="text-sm font-medium text-muted transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-50"
              >
                Omitir por ahora
              </button>

              <div className="flex items-center gap-2">
                {paso > 1 && (
                  <button
                    type="button"
                    onClick={atras}
                    disabled={guardando}
                    className="h-12 rounded-2xl px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface disabled:pointer-events-none disabled:opacity-50"
                  >
                    Atrás
                  </button>
                )}
                {paso < TOTAL_PASOS ? (
                  <button
                    type="button"
                    onClick={siguiente}
                    className="h-12 rounded-2xl bg-electric px-7 text-sm font-semibold text-white shadow-[0_10px_24px_-8px_rgba(37,99,235,0.55)] transition-transform hover:bg-electric/90 active:scale-[0.98]"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={finalizar}
                    disabled={guardando}
                    className="h-12 rounded-2xl bg-electric px-7 text-sm font-semibold text-white shadow-[0_10px_24px_-8px_rgba(37,99,235,0.55)] transition-transform hover:bg-electric/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
                  >
                    {guardando ? "Guardando…" : "Finalizar"}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

/** Envoltura animada de cada paso: slide + fade en la dirección de avance. */
function Paso({
  dir,
  reduceMotion,
  children,
}: {
  dir: number;
  reduceMotion: boolean | null;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, x: 28 * dir }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, x: -28 * dir }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

const PASOS_PREVIEW = ["Tu cargo", "Preséntate", "Tus enlaces"];

/**
 * Pantalla de bienvenida (paso 0): mismo tratamiento que la de estudiante
 * (símbolo de marca muy tenue de fondo), copy orientado a organización.
 */
function PantallaBienvenida({
  onComenzar,
  onOmitir,
  skipping,
}: {
  onComenzar: () => void;
  onOmitir: () => void;
  skipping: boolean;
}) {
  return (
    <div className="relative overflow-hidden px-10 py-14 sm:px-16 sm:py-20">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/vardelab-simbolo-negro.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-80 w-auto opacity-[0.05] sm:h-96"
      />

      <div className="relative z-10">
        <h2 id="sponsor-onboarding-titulo" className="text-3xl font-bold tracking-tight text-ink">
          Antes de publicar, arma tu perfil
        </h2>
        <p className="mt-3 max-w-md text-base leading-relaxed text-muted">
          Te toma menos de 2 minutos y ayuda a que los estudiantes confíen en tu
          organización antes de postular a un proyecto. Todo es opcional.
        </p>

        <ul className="mt-8 flex flex-col gap-2.5">
          {PASOS_PREVIEW.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-ink">
              <span className="size-1.5 shrink-0 rounded-full bg-electric" />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onOmitir}
            disabled={skipping}
            className="text-sm font-medium text-muted transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-50"
          >
            Omitir por ahora
          </button>
          <button
            type="button"
            onClick={onComenzar}
            className="h-12 rounded-2xl bg-electric px-7 text-sm font-semibold text-white shadow-[0_10px_24px_-8px_rgba(37,99,235,0.55)] transition-transform hover:bg-electric/90 active:scale-[0.98]"
          >
            Comenzar
          </button>
        </div>
      </div>
    </div>
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
        <p className="mt-2 text-base text-muted">
          Tu perfil ya está armado. Ahora puedes crear tu organización.
        </p>
      </motion.div>
    </div>
  );
}
