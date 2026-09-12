import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getPublicProfile } from "@/features/portfolio/queries";
import type { ProfileLinks } from "@/features/profile/queries";
import { ReportButton } from "@/features/reports/components/report-button";
import { PerfilIconSvg } from "@/features/profile/components/profile-icons";
import { getCurrentUser } from "@/features/auth/queries";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getPublicProfile(id);
  if (!data) return { title: "Perfil no encontrado · CampusLab" };
  const titulo = `${data.profile.nombre ?? "Perfil"} · CampusLab`;
  return {
    title: titulo,
    description: data.profile.bio ?? undefined,
    openGraph: { title: titulo, description: data.profile.bio ?? undefined },
  };
}

// Etiquetas legibles de los enlaces del perfil (la clave coincide con el
// nombre de ícono en `PerfilIconSvg`: github/linkedin/sitio).
const ENLACE_LABEL: Record<keyof ProfileLinks, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  sitio: "Sitio",
};

const NIVEL_LABEL: Record<string, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

// Iniciales para el avatar cuando no hay foto: primeras letras de hasta dos
// palabras del nombre — mismo criterio que `/perfil`.
function iniciales(nombre: string | null): string {
  const partes = (nombre ?? "").trim().split(/\s+/).slice(0, 2);
  return partes.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

/**
 * Página pública del portafolio de un estudiante. Solo existe si el perfil es
 * público (la RLS lo garantiza; `getPublicProfile` devuelve null si no) → 404.
 * Muestra la presentación, las habilidades y las evidencias marcadas públicas
 * — lo que un patrocinador necesita para evaluar si el estudiante encaja.
 */
export default async function PerfilPublicoPage({ params }: PageProps) {
  const { id } = await params;
  const [data, viewer] = await Promise.all([
    getPublicProfile(id),
    getCurrentUser(),
  ]);
  if (!data) notFound();

  const { profile, items, skills } = data;
  const esPropio = viewer?.id === profile.id;
  const enlaces = (profile.enlaces ?? {}) as ProfileLinks;
  const enlacesList = (Object.keys(ENLACE_LABEL) as (keyof ProfileLinks)[])
    .map((k) => ({ k, url: enlaces[k] }))
    .filter((e) => e.url);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      {/* Presentación, en tarjeta — mismo lenguaje visual que el resto del
          sitio, en vez de texto suelto sobre el fondo. */}
      <header className="flex flex-col gap-7 rounded-2xl border border-border bg-white p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-electric text-xl font-semibold text-white">
            {profile.avatar_url ? (
              // Foto propia o avatar del catálogo (M25/M26); no una URL externa.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                loading="lazy"
                decoding="async"
                className="size-16 object-cover"
              />
            ) : (
              iniciales(profile.nombre)
            )}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-ink">
              {profile.nombre}
            </h1>
            {(profile.carrera || profile.semestre) && (
              <p className="text-sm text-muted">
                {profile.carrera}
                {profile.carrera && profile.semestre && " · "}
                {profile.semestre && `${profile.semestre}° semestre`}
              </p>
            )}
          </div>
        </div>

        {profile.bio && <p className="text-muted">{profile.bio}</p>}

        {/* Preferencias + habilidades: dos datos de la misma naturaleza ("qué
            busca, qué sabe hacer"), agrupados con un espacio más cerrado entre
            ellos que el que separa al resto de los bloques del encabezado. */}
        {(profile.intereses || skills.length > 0) && (
          <div className="flex flex-col gap-4">
            {profile.intereses && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Preferencias de proyectos
                </p>
                <p className="mt-1.5 text-sm text-ink">{profile.intereses}</p>
              </div>
            )}

            {skills.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Habilidades
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <Badge key={s.skill?.id ?? s.skill_id} tone="outline">
                      {s.skill?.nombre}
                      {s.nivel && (
                        <span className="text-muted/70">
                          {" "}
                          · {NIVEL_LABEL[s.nivel] ?? s.nivel}
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {enlacesList.length > 0 && (
          <div className="flex flex-wrap gap-5">
            {enlacesList.map((e) => (
              <a
                key={e.k}
                href={e.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-electric hover:underline"
              >
                <PerfilIconSvg name={e.k} className="size-4" />
                {ENLACE_LABEL[e.k]}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* Portafolio */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink">Portafolio</h2>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Todavía no hay evidencias públicas.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {items.map((it) => (
              <li
                key={it.id}
                className="rounded-lg border border-border bg-white p-5"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink">{it.titulo}</span>
                  {it.project?.titulo && (
                    <Badge tone="brand">{it.project.titulo}</Badge>
                  )}
                </div>
                {it.descripcion && (
                  <p className="mt-1 text-sm text-muted">{it.descripcion}</p>
                )}
                {it.url && (
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm text-electric hover:underline"
                  >
                    {it.url}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* No tiene sentido ofrecer reportar el propio perfil (y el server
          action ahora lo rechaza igual) — se oculta directamente. */}
      {!esPropio && (
        <div className="mt-8">
          <ReportButton targetType="perfil" targetId={profile.id} />
        </div>
      )}
    </main>
  );
}
