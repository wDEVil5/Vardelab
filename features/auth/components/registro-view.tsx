"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AuthShell,
  AuthShellStep,
  AuthSlide,
} from "@/features/auth/components/auth-shell";
import { SignupForm, type Rol } from "@/features/auth/components/signup-form";

// Pasos según el rol elegido: el registro se adapta a quién eres.
const PASOS: Record<Rol, { titulo: string; pasos: { titulo: string; texto: string }[] }> = {
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

/** A-01 · Vista de registro: el rol elegido controla los pasos del carrusel. */
export function RegistroView() {
  const [rol, setRol] = useState<Rol>("estudiante");
  const contenido = PASOS[rol];

  const slides = [
    <AuthSlide key="pasos" eyebrow="Así funciona" titulo={contenido.titulo}>
      <div className="flex flex-col gap-4">
        {contenido.pasos.map((paso, i) => (
          <AuthShellStep
            key={paso.titulo}
            n={i + 1}
            titulo={paso.titulo}
            texto={paso.texto}
            active={i === contenido.pasos.length - 1}
          />
        ))}
      </div>
    </AuthSlide>,
    <AuthSlide
      key="evidencia"
      eyebrow="Evidencia verificable"
      titulo="Tu trabajo, demostrable"
    >
      <p className="text-sm text-white/60">
        Cada participación queda ligada a una organización real: es un hecho, no
        una línea más de CV.
      </p>
    </AuthSlide>,
    <AuthSlide key="piloto" eyebrow="El piloto" titulo="Microproyectos guiados">
      <p className="text-sm text-white/60">
        10+ proyectos piloto · 4 semanas de duración promedio, por hitos y con
        acompañamiento.
      </p>
    </AuthSlide>,
  ];

  return (
    <AuthShell slides={slides}>
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
