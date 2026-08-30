import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";
import { AuthShell, AuthSlide } from "@/features/auth/components/auth-shell";
import { getPublishedProjects } from "@/features/projects/queries";

export const metadata: Metadata = {
  title: "Ingresar · CampusLab",
};

/** A-02 · Inicio de sesión. */
export default async function IngresarPage() {
  // Para la slide de oportunidades: proyectos reales del catálogo.
  const proyectos = await getPublishedProjects();
  const primeros = proyectos.slice(0, 3);
  const resto = Math.max(0, proyectos.length - primeros.length);

  const oportunidades =
    primeros.length > 0 ? (
      <AuthSlide
        key="oportunidades"
        eyebrow="Oportunidades abiertas"
        titulo="Encuentra un desafío para ti"
      >
        <ul className="flex flex-col gap-5">
          {primeros.map((p, i) => {
            const cupos = (p.roles ?? []).reduce((t, r) => t + r.cupos, 0);
            return (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3"
              >
                <span className="line-clamp-1 text-sm font-medium text-white">
                  {p.titulo}
                </span>
                <span
                  className={
                    i === 0
                      ? "shrink-0 rounded-full bg-electric px-3 py-1 text-xs font-medium text-white"
                      : "shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80"
                  }
                >
                  {i === 0 || cupos === 0 ? "Abierto" : `${cupos} cupos`}
                </span>
              </li>
            );
          })}
        </ul>
        {resto > 0 && (
          <p className="text-sm text-white/40">
            +{resto} {resto === 1 ? "desafío más" : "desafíos más"} en el piloto
          </p>
        )}
      </AuthSlide>
    ) : (
      <AuthSlide
        key="oportunidades"
        eyebrow="Oportunidades abiertas"
        titulo="Encuentra un desafío para ti"
      >
        <p className="text-sm text-white/60">
          Microproyectos reales, por hitos y con evidencia verificable para tu
          portafolio.
        </p>
      </AuthSlide>
    );

  const slides = [
    oportunidades,
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
    <AuthSlide key="piloto" eyebrow="El piloto" titulo="Del desafío a tu portafolio">
      <p className="text-sm text-white/60">
        10+ proyectos piloto · 4 semanas de duración promedio, con acompañamiento.
      </p>
    </AuthSlide>,
  ];

  return (
    <AuthShell slides={slides}>
      <div className="rounded-2xl border border-border bg-white p-8">
        <h1 className="text-2xl font-bold text-ink">Bienvenido de vuelta</h1>
        <p className="mt-1 text-sm text-muted">
          Ingresa para continuar con tus proyectos.
        </p>

        <div className="mt-6">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          ¿Aún no tienes cuenta?{" "}
          <Link
            href="/registro"
            className="font-medium text-electric hover:underline"
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
