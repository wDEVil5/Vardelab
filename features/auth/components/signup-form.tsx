"use client";

import { useActionState } from "react";
import { signUp, type AuthState } from "@/features/auth/actions";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "./submit-button";

const INITIAL: AuthState = {};

// Opciones de tipo de cuenta (roles de autoservicio, coinciden con M11).
const TIPOS_CUENTA = [
  { valor: "estudiante", titulo: "Estudiante", detalle: "Postulo a proyectos" },
  {
    valor: "patrocinador",
    titulo: "Patrocinador",
    detalle: "Publico necesidades",
  },
] as const;

export function SignupForm() {
  const [state, formAction] = useActionState(signUp, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* Tipo de cuenta: radios estilados como tarjetas seleccionables */}
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-medium text-ink">
          Tipo de cuenta
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {TIPOS_CUENTA.map((tipo, i) => (
            <label
              key={tipo.valor}
              className="flex cursor-pointer flex-col gap-0.5 rounded-md border border-border p-3 transition-colors has-[:checked]:border-electric has-[:checked]:bg-electric/5"
            >
              <input
                type="radio"
                name="rol"
                value={tipo.valor}
                defaultChecked={i === 0}
                className="sr-only"
              />
              <span className="text-sm font-medium text-ink">
                {tipo.titulo}
              </span>
              <span className="text-xs text-muted">{tipo.detalle}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Nombre</span>
        <Input
          type="text"
          name="nombre"
          autoComplete="name"
          required
          placeholder="Tu nombre"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Correo</span>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="tucorreo@ejemplo.cl"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Contraseña</span>
        <Input
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-coral">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Creando cuenta…">Crear cuenta</SubmitButton>
    </form>
  );
}
