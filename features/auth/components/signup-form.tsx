"use client";

import { useActionState } from "react";
import { signUp, type AuthState } from "@/features/auth/actions";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PasswordField } from "./password-field";
import { SubmitButton } from "./submit-button";

const INITIAL: AuthState = {};

export type Rol = "estudiante" | "patrocinador";

// Íconos de rol (línea, toman el color del texto padre).
function IconEstudiante() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-6"
      aria-hidden
    >
      <path d="M12 4 2 9l10 5 10-5-10-5Z" />
      <path d="M6 11.5V16c0 1.1 2.7 2.5 6 2.5s6-1.4 6-2.5v-4.5" />
      <path d="M22 9v5" />
    </svg>
  );
}

function IconPatrocinador() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-6"
      aria-hidden
    >
      <path d="M3 21h18" />
      <path d="M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16" />
      <path d="M15 21V9h3a1 1 0 0 1 1 1v11" />
      <path d="M8 7h1M8 11h1M8 15h1M11 7h1M11 11h1M11 15h1" />
    </svg>
  );
}

// Opciones de tipo de cuenta (roles de autoservicio, coinciden con M11).
export const ROLES: {
  valor: Rol;
  Icono: () => React.ReactElement;
  titulo: string;
  detalle: string;
}[] = [
  {
    valor: "estudiante",
    Icono: IconEstudiante,
    titulo: "Estudiante",
    detalle: "Explora microproyectos y crea evidencia para tu portafolio.",
  },
  {
    valor: "patrocinador",
    Icono: IconPatrocinador,
    titulo: "Patrocinador",
    detalle: "Publica un desafío y suma un equipo de estudiantes.",
  },
];

/**
 * Formulario de registro. El rol es controlado desde afuera para que el panel de
 * marca muestre información acorde (estudiante vs. patrocinador).
 */
export function SignupForm({
  rol,
  onRolChange,
}: {
  rol: Rol;
  onRolChange: (rol: Rol) => void;
}) {
  const [state, formAction] = useActionState(signUp, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* Tipo de cuenta: tarjetas seleccionables. */}
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-medium text-ink">Tu rol</legend>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map((tipo) => {
            const activo = rol === tipo.valor;
            return (
              <label
                key={tipo.valor}
                className={cn(
                  "flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition-colors",
                  activo
                    ? "border-electric bg-electric/5"
                    : "border-border hover:border-electric/50",
                )}
              >
                <input
                  type="radio"
                  name="rol"
                  value={tipo.valor}
                  checked={activo}
                  onChange={() => onRolChange(tipo.valor)}
                  className="sr-only"
                />
                <span className={activo ? "text-electric" : "text-ink"}>
                  <tipo.Icono />
                </span>
                <span
                  className={cn(
                    "mt-1 text-sm font-semibold",
                    activo ? "text-electric" : "text-ink",
                  )}
                >
                  {tipo.titulo}
                </span>
                <span className="text-xs text-muted">{tipo.detalle}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Nombre completo</span>
        <Input
          type="text"
          name="nombre"
          autoComplete="name"
          required
          placeholder="Tu nombre"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Correo personal</span>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="nombre@ejemplo.com"
        />
      </label>

      <PasswordField />

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Creando cuenta…">Crear cuenta</SubmitButton>
    </form>
  );
}
