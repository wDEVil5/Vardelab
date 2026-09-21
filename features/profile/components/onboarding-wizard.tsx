"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useModalBehavior } from "@/components/ui/use-modal-behavior";
import {
  addOnboardingSkill,
  completeOnboarding,
  removeOnboardingSkill,
  skipOnboarding,
} from "@/features/profile/actions";
import type { Skill } from "@/features/skills/queries";

const TOTAL_PASOS = 5;
// Cuánto se queda la animación de cierre en pantalla antes de empezar a
// desvanecerse (ver `saliendo` más abajo).
const DURACION_EXITO_MS = 1600;
// Duración del fundido de salida: hasta que termina, no se refresca el
// layout, así la desaparición es un fundido, no un corte.
const DURACION_SALIDA_S = 0.45;

const NIVEL_LABEL: Record<string, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

type SkillElegida = { skillId: string; nombre: string; nivel: string };

/**
 * Onboarding tras registrarse (M87): wizard de 5 pasos + pantalla de cierre,
 * sobre /inicio mientras `onboarding_completado` sea falso (ver
 * app/(app)/layout.tsx). No se puede cerrar con Escape ni clic afuera, es
 * un paso del flujo de entrada; "Omitir por ahora" es la única salida sin
 * completarlo. Alto fijo en todos los pasos (el más alto marca el estándar,
 * el resto se acomoda ahí) para que el modal no salte de tamaño al avanzar.
 */
export function OnboardingWizard({ catalog }: { catalog: Skill[] }) {
  const [fase, setFase] = useState<"bienvenida" | "form" | "exito">("bienvenida");
  const [paso, setPaso] = useState(1);
  const [dir, setDir] = useState(1);
  const [carrera, setCarrera] = useState("");
  const [semestre, setSemestre] = useState("");
  const [semestreError, setSemestreError] = useState("");
  const [bio, setBio] = useState("");
  const [intereses, setIntereses] = useState("");
  const [skills, setSkills] = useState<SkillElegida[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [skipping, setSkipping] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const router = useRouter();

  useModalBehavior({ open: true, onClose: () => {}, containerRef });

  function siguiente() {
    if (paso === 2 && semestre.trim()) {
      const n = Number(semestre.trim());
      if (!Number.isInteger(n) || n < 1 || n > 14) {
        setSemestreError("El semestre debe ser un número entre 1 y 14.");
        return;
      }
    }
    setSemestreError("");
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
    const result = await completeOnboarding({ carrera, semestre, bio, intereses });
    setGuardando(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setFase("exito");
    // No se refresca de inmediato: primero se ve el check un rato
    // (DURACION_EXITO_MS), y recién cuando el fundido de salida termina
    // (onAnimationComplete más abajo) se pide el refresh.
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
      return;
    }
    // Sin setSkipping(false) en el camino feliz: skipOnboarding sí revalida
    // /inicio, así que el layout desmonta este componente solo.
  }

  return (
    <motion.div
      // pointer-events-none una vez que empieza a salir: si router.refresh()
      // tardara o fallara, un overlay a opacity:0 pero fixed inset-0 se
      // quedaría bloqueando clics en toda la pantalla, invisible. Con esto,
      // en el peor caso el modal no desaparece pero tampoco deja la página
      // inutilizable.
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
        aria-labelledby="onboarding-titulo"
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
          <PantallaBienvenida
            onComenzar={() => setFase("form")}
            onOmitir={omitir}
            skipping={skipping}
          />
        ) : fase === "exito" ? (
          <PantallaExito />
        ) : (
          <>
            {/* Una sola barra continua (mismo lenguaje que la de completitud
                del perfil), no segmentos: se rellena de a poco en vez de
                prender casilleros. */}
            <div className="px-10 pt-10 sm:px-16 sm:pt-14">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-electric transition-[width] duration-300 ease-out"
                  style={{ width: `${(paso / TOTAL_PASOS) * 100}%` }}
                />
              </div>
            </div>

            <div className="overflow-y-auto px-10 py-10 sm:px-16 sm:py-12">
              {/* Alto mínimo fijo (el paso más alto, "Cuéntanos sobre ti",
                  marca el estándar): los pasos más cortos no achican el
                  modal, evita el salto brusco de tamaño al avanzar. */}
              <div className="relative min-h-88 sm:min-h-96">
                <AnimatePresence mode="wait" initial={false}>
                  {paso === 1 && (
                    <Paso key={1} dir={dir} reduceMotion={reduceMotion}>
                      <h2 id="onboarding-titulo" className="text-3xl font-bold tracking-tight text-ink">
                        ¿Qué estás estudiando?
                      </h2>
                      <p className="mt-3 max-w-md text-base leading-relaxed text-muted">
                        Con tu carrera, las organizaciones entienden mejor tu perfil antes de
                        conocerte. Es opcional, puedes dejarlo en blanco y completarlo más tarde.
                      </p>

                      <div className="mt-10">
                        <Input
                          autoFocus
                          value={carrera}
                          onChange={(e) => setCarrera(e.target.value)}
                          placeholder="Ej: Ingeniería Comercial, Diseño, Psicología…"
                          className="h-14 rounded-2xl px-5 text-base"
                        />
                      </div>
                    </Paso>
                  )}

                  {paso === 2 && (
                    <Paso key={2} dir={dir} reduceMotion={reduceMotion}>
                      <h2 className="text-3xl font-bold tracking-tight text-ink">
                        ¿En qué semestre vas?
                      </h2>
                      <p className="mt-3 max-w-md text-base leading-relaxed text-muted">
                        Ayuda a calibrar expectativas. No es lo mismo alguien recién empezando
                        que alguien por egresar. También opcional.
                      </p>

                      <div className="mt-10">
                        <Input
                          autoFocus
                          type="number"
                          min={1}
                          max={14}
                          value={semestre}
                          onChange={(e) => setSemestre(e.target.value)}
                          placeholder="Ej: 6"
                          className="h-14 max-w-40 rounded-2xl px-5 text-base"
                        />
                        {semestreError && (
                          <p role="alert" className="mt-2 text-sm text-coral">
                            {semestreError}
                          </p>
                        )}
                      </div>
                    </Paso>
                  )}

                  {paso === 3 && (
                    <Paso key={3} dir={dir} reduceMotion={reduceMotion}>
                      <h2 className="text-3xl font-bold tracking-tight text-ink">
                        Cuéntanos sobre ti
                      </h2>
                      <p className="mt-3 max-w-md text-base leading-relaxed text-muted">
                        Unas líneas sobre quién eres y qué te mueve. Es lo primero que conecta
                        con una organización, más allá del currículum.
                      </p>

                      <div className="mt-10">
                        <Textarea
                          autoFocus
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="En pocas palabras, qué te interesa y qué buscas…"
                          className="min-h-40 rounded-2xl px-5 py-4 text-base"
                        />
                      </div>
                    </Paso>
                  )}

                  {paso === 4 && (
                    <Paso key={4} dir={dir} reduceMotion={reduceMotion}>
                      <h2 className="text-3xl font-bold tracking-tight text-ink">
                        ¿Qué te interesa?
                      </h2>
                      <p className="mt-3 max-w-md text-base leading-relaxed text-muted">
                        Áreas, temas o causas que te llaman la atención. Ayuda a encontrar
                        proyectos que realmente te importen.
                      </p>

                      <div className="mt-10">
                        <Input
                          autoFocus
                          value={intereses}
                          onChange={(e) => setIntereses(e.target.value)}
                          placeholder="Ej: datos, diseño de producto, sustentabilidad…"
                          className="h-14 rounded-2xl px-5 text-base"
                        />
                      </div>
                    </Paso>
                  )}

                  {paso === 5 && (
                    <Paso key={5} dir={dir} reduceMotion={reduceMotion}>
                      <h2 className="text-3xl font-bold tracking-tight text-ink">
                        ¿Qué ya sabes hacer?
                      </h2>
                      <p className="mt-3 max-w-md text-base leading-relaxed text-muted">
                        No hace falta ser experto. Elige lo que ya manejas, aunque recién estés
                        empezando. Puedes sumar más después desde tu perfil.
                      </p>

                      <div className="mt-10">
                        <HabilidadesPaso catalog={catalog} skills={skills} onSkillsChange={setSkills} />
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

const PASOS_PREVIEW = [
  "Tu carrera",
  "Tu semestre",
  "Un poco sobre ti",
  "Tus intereses",
  "Tus habilidades",
];

/**
 * Pantalla de bienvenida (paso 0): da contexto antes de arrancar el wizard,
 * en vez de que las preguntas aparezcan de golpe sin avisar qué se viene ni
 * cuánto toma. Sin barra de progreso acá: no es un paso de datos, es la
 * puerta de entrada. El símbolo de la marca va de fondo, muy tenue, mismo
 * tratamiento que `AuthImagePanel`.
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
        <h2 id="onboarding-titulo" className="text-3xl font-bold tracking-tight text-ink">
          Antes de entrar, arma tu perfil
        </h2>
        <p className="mt-3 max-w-md text-base leading-relaxed text-muted">
          Te toma menos de 2 minutos y te ayuda a que las organizaciones te conozcan
          mejor desde el primer momento. Todo es opcional.
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
        <p className="mt-2 text-base text-muted">Tu perfil ya está armado. Te llevamos a tu panel.</p>
      </motion.div>
    </div>
  );
}

/**
 * Selector de habilidades del último paso. Estado propio en vez de reusar
 * `ProfileSkillsEditor`: ese componente asume que su lista de `skills` la
 * refresca el server component padre vía `revalidatePath("/perfil")`, ruta
 * que acá no aplica (el modal vive sobre /inicio). Sin estado local, una
 * habilidad agregada no se vería hasta un refresh manual.
 */
function HabilidadesPaso({
  catalog,
  skills,
  onSkillsChange,
}: {
  catalog: Skill[];
  skills: SkillElegida[];
  onSkillsChange: (skills: SkillElegida[]) => void;
}) {
  const [skillId, setSkillId] = useState("");
  const [nivel, setNivel] = useState("basico");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const elegidos = new Set(skills.map((s) => s.skillId));
  const disponibles = catalog.filter((s) => !elegidos.has(s.id));

  async function agregar() {
    if (!skillId) return;
    setPending(true);
    setError("");
    const result = await addOnboardingSkill(skillId, nivel);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    const skill = catalog.find((s) => s.id === skillId);
    onSkillsChange([...skills, { skillId, nombre: skill?.nombre ?? "", nivel }]);
    setSkillId("");
  }

  async function quitar(id: string) {
    const quitada = skills.find((s) => s.skillId === id);
    onSkillsChange(skills.filter((s) => s.skillId !== id));
    setError("");
    const result = await removeOnboardingSkill(id);
    if (result.error && quitada) {
      // Revierte el optimismo: si el delete falló, la habilidad sigue en la
      // base y no debe desaparecer de la vista como si ya no estuviera.
      onSkillsChange([...skills.filter((s) => s.skillId !== id), quitada]);
      setError(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span
              key={s.skillId}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-2 text-sm text-ink"
            >
              {s.nombre}
              <span className="text-muted/70">· {NIVEL_LABEL[s.nivel] ?? s.nivel}</span>
              <button
                type="button"
                onClick={() => quitar(s.skillId)}
                aria-label={`Quitar ${s.nombre}`}
                className="ml-0.5 text-muted/60 hover:text-coral"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {disponibles.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
            className="h-12 rounded-2xl border border-border bg-white px-4 text-sm text-ink focus-visible:border-electric focus-visible:outline-none"
          >
            <option value="">Elegir habilidad…</option>
            {disponibles.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
          <select
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
            className="h-12 rounded-2xl border border-border bg-white px-4 text-sm text-ink focus-visible:border-electric focus-visible:outline-none"
          >
            <option value="basico">Básico</option>
            <option value="intermedio">Intermedio</option>
            <option value="avanzado">Avanzado</option>
          </select>
          <button
            type="button"
            onClick={agregar}
            disabled={!skillId || pending}
            className="h-12 rounded-2xl px-5 text-sm font-semibold text-electric transition-colors hover:bg-electric/10 disabled:pointer-events-none disabled:opacity-50"
          >
            + Agregar
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-coral">
          {error}
        </p>
      )}
    </div>
  );
}
