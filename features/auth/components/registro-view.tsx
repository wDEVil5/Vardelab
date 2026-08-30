"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AuthShell,
  AuthShellStep,
} from "@/features/auth/components/auth-shell";
import { SignupForm, type Rol } from "@/features/auth/components/signup-form";

// Contenido del panel según el rol elegido: el registro se adapta a quién eres.
const ASIDE: Record<
  Rol,
  { titulo: string; pasos: { titulo: string; texto: string }[] }
> = {
  estudiante: {
    titulo: "Un camino simple para empezar",
    pasos: [
      { titulo: "Completa tu perfil", texto: "Cuéntanos qué sabes hacer." },
      { titulo: "Explora un microproyecto", texto: "Elige un desafío real." },
      {
        titulo: "Colabora y demuestra",
        texto: "Construye evidencia para tu portafolio.",
      },
    ],
  },
  patrocinador: {
    titulo: "Del desafío a tu equipo",
    pasos: [
      { titulo: "Publica un desafío", texto: "Describe una necesidad acotada." },
      {
        titulo: "Recibe postulaciones",
        texto: "Elige a los estudiantes que calcen.",
      },
      {
        titulo: "Acompaña y evalúa",
        texto: "Sigue los hitos y evalúa el trabajo.",
      },
    ],
  },
};

/** A-01 · Vista de registro: el rol elegido controla el panel de marca. */
export function RegistroView() {
  const [rol, setRol] = useState<Rol>("estudiante");
  const contenido = ASIDE[rol];

  return (
    <AuthShell
      aside={
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-electric">
              Así funciona
            </span>
            <span className="text-lg font-semibold text-white">
              {contenido.titulo}
            </span>
          </div>
          {contenido.pasos.map((paso, i) => (
            <AuthShellStep
              key={paso.titulo}
              n={i + 1}
              titulo={paso.titulo}
              texto={paso.texto}
            />
          ))}
        </div>
      }
    >
      <div className="rounded-2xl border border-border bg-white p-8">
        <h1 className="text-2xl font-bold text-ink">Crea tu cuenta</h1>
        <p className="mt-1 text-sm text-muted">
          Elige cómo participarás en el piloto.
        </p>

        <div className="mt-6">
          <SignupForm rol={rol} onRolChange={setRol} />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/ingresar"
            className="font-medium text-electric hover:underline"
          >
            Ingresar
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
