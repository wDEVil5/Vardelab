import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  getMyProfile,
  getMyProfileSkills,
  type ProfileLinks,
} from "@/features/profile/queries";
import { setProfileVisibility } from "@/features/profile/actions";
import { getActiveSkills } from "@/features/skills/queries";
import { getMyPortfolioItems } from "@/features/portfolio/queries";
import { getMyTeams } from "@/features/teams/queries";
import { EditProfileDialog } from "@/features/profile/components/edit-profile-dialog";
import { ProfileSkillsEditor } from "@/features/profile/components/profile-skills-editor";
import { PortfolioEditor } from "@/features/portfolio/components/portfolio-editor";

export const metadata: Metadata = {
  title: "Mi perfil · CampusLab",
};

// Etiquetas legibles de los enlaces del perfil.
const ENLACE_LABEL: Record<keyof ProfileLinks, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  sitio: "Sitio",
};

// Iniciales para el avatar: primeras letras de hasta dos palabras del nombre.
function iniciales(nombre: string | null): string {
  const partes = (nombre ?? "").trim().split(/\s+/).slice(0, 2);
  return partes.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

// Campo de solo lectura: etiqueta arriba, valor debajo (o un guion si falta).
function Campo({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-ink">
        {valor?.trim() ? valor : <span className="text-muted">—</span>}
      </dd>
    </div>
  );
}

/** Edición del perfil propio, distribuida en tarjetas. Requiere sesión. */
export default async function PerfilPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/ingresar?next=/perfil");

  const [profileSkills, catalog, portfolio, teams] = await Promise.all([
    getMyProfileSkills(),
    getActiveSkills(),
    getMyPortfolioItems(),
    getMyTeams(),
  ]);

  // Proyectos que integró: opciones para ligar una evidencia (la hacen verificable).
  const projectOptions = teams
    .filter((t) => t.projectId)
    .map((t) => ({ id: t.projectId!, titulo: t.projectTitulo }));

  const esPublico = profile.visibility === "publico";
  const enlaces = (profile.enlaces ?? {}) as ProfileLinks;
  const enlacesList = (Object.keys(ENLACE_LABEL) as (keyof ProfileLinks)[])
    .map((k) => ({ k, url: enlaces[k] }))
    .filter((e) => e.url);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Mi perfil</h1>
        <p className="text-sm text-muted">
          Información que ven los patrocinadores al revisar tus postulaciones.
        </p>
      </header>

      {/* Tarjeta de identidad: resumen de un vistazo (se edita más abajo). */}
      <section className="mt-6 rounded-2xl border border-border bg-white p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-electric text-xl font-semibold text-white">
            {iniciales(profile.nombre)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-bold text-ink">
              {profile.nombre || "Sin nombre"}
            </p>
            {(profile.carrera || profile.semestre) && (
              <p className="text-sm text-muted">
                {profile.carrera}
                {profile.carrera && profile.semestre != null && " · "}
                {profile.semestre != null && `${profile.semestre}° semestre`}
              </p>
            )}
            <div className="mt-2">
              <Badge tone={esPublico ? "success" : "neutral"}>
                {esPublico ? "Perfil público" : "Perfil privado"}
              </Badge>
            </div>
          </div>
          <EditProfileDialog profile={profile} />
        </div>
      </section>

      {/* Franja de visibilidad: un ajuste sobre todo el perfil, no contenido. */}
      <section className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface/60 p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-muted">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-medium text-ink">
              {esPublico ? "Perfil público" : "Perfil privado"}
            </p>
            <p className="text-sm text-muted">
              {esPublico
                ? "Cualquiera con el enlace ve tu perfil y tus evidencias públicas."
                : "Solo tú lo ves. Hazlo público para compartir tu portafolio."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form action={setProfileVisibility}>
            <input
              type="hidden"
              name="visibility"
              value={esPublico ? "privado" : "publico"}
            />
            <SubmitButton
              variant={esPublico ? "secondary" : "primary"}
              size="sm"
              pendingText="Guardando…"
            >
              {esPublico ? "Hacer privado" : "Hacer público"}
            </SubmitButton>
          </form>
          {esPublico && (
            <Link
              href={`/u/${profile.id}`}
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              Ver página pública
            </Link>
          )}
        </div>
      </section>

      {/* Dos bloques: izquierda los datos (un solo form), derecha lo demás. */}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        {/* Bloque izquierdo: datos en solo lectura (se editan con "Editar perfil"). */}
        <section className="rounded-2xl border border-border bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">Tus datos</h2>
          <dl className="mt-4 flex flex-col gap-4">
            <Campo label="Presentación" valor={profile.bio} />
            <Campo label="Preferencias de proyectos" valor={profile.intereses} />
            <Campo label="Disponibilidad" valor={profile.disponibilidad} />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                Enlaces
              </dt>
              <dd className="mt-1">
                {enlacesList.length > 0 ? (
                  <ul className="flex flex-col gap-1 text-sm">
                    {enlacesList.map((e) => (
                      <li key={e.k}>
                        <a
                          href={e.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-electric hover:underline"
                        >
                          {ENLACE_LABEL[e.k]}
                        </a>
                        <span className="text-muted"> · {e.url}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm text-muted">Sin enlaces</span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        {/* Bloque derecho: habilidades, portafolio y visibilidad apilados. */}
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-border bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">Habilidades</h2>
            <p className="mt-1 text-sm text-muted">
              Lo que sabes hacer y tu nivel: ayuda a que te encuentren.
            </p>
            <div className="mt-4">
              <ProfileSkillsEditor skills={profileSkills} catalog={catalog} />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">Portafolio</h2>
            <p className="mt-1 text-sm text-muted">
              Reúne tus evidencias y decide cuáles mostrar. Ligar una evidencia a
              un proyecto que integraste la vuelve verificable.
            </p>
            <div className="mt-4">
              <PortfolioEditor items={portfolio} projects={projectOptions} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
