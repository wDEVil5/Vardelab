import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getPublicProfile } from "@/features/portfolio/queries";
import type { ProfileLinks } from "@/features/profile/queries";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getPublicProfile(id);
  if (!data) return { title: "Perfil no encontrado · CampusLab" };
  return {
    title: `${data.profile.nombre ?? "Perfil"} · CampusLab`,
    description: data.profile.bio ?? undefined,
  };
}

// Etiquetas legibles de los enlaces del perfil.
const ENLACE_LABEL: Record<keyof ProfileLinks, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  sitio: "Sitio",
};

/**
 * Página pública del portafolio de un estudiante. Solo existe si el perfil es
 * público (la RLS lo garantiza; `getPublicProfile` devuelve null si no) → 404.
 * Muestra la presentación y las evidencias marcadas públicas.
 */
export default async function PerfilPublicoPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getPublicProfile(id);
  if (!data) notFound();

  const { profile, items } = data;
  const enlaces = (profile.enlaces ?? {}) as ProfileLinks;
  const enlacesList = (Object.keys(ENLACE_LABEL) as (keyof ProfileLinks)[])
    .map((k) => ({ k, url: enlaces[k] }))
    .filter((e) => e.url);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      {/* Presentación */}
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">{profile.nombre}</h1>
        {(profile.carrera || profile.semestre) && (
          <p className="text-sm text-muted">
            {profile.carrera}
            {profile.carrera && profile.semestre && " · "}
            {profile.semestre && `${profile.semestre}° semestre`}
          </p>
        )}
        {profile.bio && <p className="text-muted">{profile.bio}</p>}

        {enlacesList.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {enlacesList.map((e) => (
              <a
                key={e.k}
                href={e.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-electric hover:underline"
              >
                {ENLACE_LABEL[e.k]}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* Portafolio */}
      <section className="mt-10">
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
    </main>
  );
}
