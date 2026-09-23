import type { ComponentType } from "react";
import type { Metadata } from "next";
import Link from "next/link";
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
  if (!data) return { title: "Perfil no encontrado · Vardelab" };
  const titulo = `${data.profile.nombre ?? "Perfil"} · Vardelab`;
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

// Tono del badge según el nivel — antes los tres se veían idénticos (mismo
// contorno gris), así que no se notaba de un vistazo quién es fuerte en qué.
// El peso del color acompaña el peso del nivel: básico gris, intermedio en
// la marca, avanzado en verde (mismo "success" que usa el resto del sitio
// para lo más destacado).
const NIVEL_TONE: Record<string, "neutral" | "brand" | "success"> = {
  basico: "neutral",
  intermedio: "brand",
  avanzado: "success",
};

// Avanzado primero: es lo que más le importa ver a un patrocinador de un
// vistazo, no el orden en que se cargaron en la base de datos.
const NIVEL_ORDEN: Record<string, number> = { avanzado: 0, intermedio: 1, basico: 2 };

// Iniciales para el avatar cuando no hay foto: primeras letras de hasta dos
// palabras del nombre — mismo criterio que `/perfil`.
function iniciales(nombre: string | null): string {
  const partes = (nombre ?? "").trim().split(/\s+/).slice(0, 2);
  return partes.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

// "Mes y año" en español, para "En Vardelab desde…" — no hace falta más
// precisión que esa para una fecha de ingreso.
function mesYAnio(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  });
}

// Dominio visible de una URL ("github.com/usuario" en vez de la URL entera
// con protocolo) — más limpio en una tarjeta del portafolio.
function dominioDe(url: string): string {
  try {
    const u = new URL(url);
    return (u.hostname + u.pathname).replace(/\/$/, "").replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Ícono de evidencia (documento con esquina doblada): tipo por defecto, sin enlace o de origen desconocido. */
function IconEvidencia({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

/** Ícono de enlace externo, para el link de cada evidencia. */
function IconEnlace({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

/** Ícono de código (repositorio: GitHub, GitLab, Bitbucket). */
function IconCodigo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 18l-6-6 6-6M15 6l6 6-6 6" />
    </svg>
  );
}

/** Ícono de diseño (Figma / prototipo). */
function IconDiseno({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" opacity=".35" />
    </svg>
  );
}

/** Ícono de app móvil (App Store / Play Store). */
function IconApp({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M11 19h2" />
    </svg>
  );
}

/** Ícono de video (YouTube / Vimeo / Loom). */
function IconVideo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path d="M17 10l4-2.5v9L17 14" />
    </svg>
  );
}

/** Ícono de calendario, para "en Vardelab desde…". */
function IconCalendario({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

/** Ícono de check en círculo, para "proyectos completados". */
function IconCompletado({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  );
}

// Ícono según el origen del link — antes toda evidencia (un repo, una app,
// un case study personal) usaba el mismo documento genérico, sin ninguna
// pista de qué tipo de cosa era antes de hacer clic.
function iconoDeTipo(url: string | null): ComponentType<{ className?: string }> {
  if (!url) return IconEvidencia;
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return IconEvidencia;
  }
  if (host.includes("github.com") || host.includes("gitlab.com") || host.includes("bitbucket.org")) {
    return IconCodigo;
  }
  if (host.includes("figma.com")) return IconDiseno;
  if (host.includes("apple.com") || host.includes("play.google.com")) return IconApp;
  if (host.includes("youtube.com") || host.includes("youtu.be") || host.includes("vimeo.com") || host.includes("loom.com")) {
    return IconVideo;
  }
  return IconEnlace;
}

/**
 * Página pública del portafolio de un estudiante. Solo existe si el perfil es
 * público (la RLS lo garantiza; `getPublicProfile` devuelve null si no) → 404.
 * Muestra la presentación, las habilidades y solo las evidencias marcadas
 * públicas — lo que un patrocinador necesita para evaluar si el estudiante
 * encaja, sin exponer elementos privados.
 */
export default async function PerfilPublicoPage({ params }: PageProps) {
  const { id } = await params;
  const [data, viewer] = await Promise.all([
    getPublicProfile(id),
    getCurrentUser(),
  ]);
  if (!data) notFound();

  const { profile, items, skills, proyectosCompletados, esPatrocinador } = data;
  const esPropio = viewer?.id === profile.id;
  const enlaces = (profile.enlaces ?? {}) as ProfileLinks;
  const enlacesList = (Object.keys(ENLACE_LABEL) as (keyof ProfileLinks)[])
    .map((k) => ({ k, url: enlaces[k] }))
    .filter((e) => e.url && (e.k !== "github" || !esPatrocinador));

  // Solo le importa a quien es dueño del perfil: es la lista de lo que le
  // conviene completar antes de que alguien más lo vea. Doble uso — se
  // muestra en la tarjeta de la derecha (que si no, quedaba vacía apenas no
  // hay enlaces) y evita mostrar la tarjeta si ya no falta nada. Habilidades
  // y portafolio son de estudiante — no aplican a un patrocinador.
  const faltantes = esPropio
    ? esPatrocinador
      ? [
          !profile.cargo && "Agrega tu cargo",
          !profile.bio && "Preséntate ante los estudiantes",
          enlacesList.length === 0 && "Agrega un enlace (LinkedIn o tu sitio)",
        ].filter((f): f is string => Boolean(f))
      : [
          !profile.bio && "Cuéntanos sobre ti",
          skills.length === 0 && "Suma tus habilidades",
          enlacesList.length === 0 && "Agrega un enlace (GitHub, LinkedIn o tu sitio)",
          items.length === 0 && "Publica una evidencia en tu portafolio",
        ].filter((f): f is string => Boolean(f))
    : [];

  // Avanzado primero: lo que más le importa ver a un patrocinador de un
  // vistazo, no el orden en que se cargaron en la base de datos.
  const skillsOrdenadas = [...skills].sort(
    (a, b) => (NIVEL_ORDEN[a.nivel ?? ""] ?? 9) - (NIVEL_ORDEN[b.nivel ?? ""] ?? 9),
  );

  // Portafolio agrupado por proyecto: antes cada tarjeta repetía el badge del
  // proyecto, y varias evidencias del mismo proyecto no se sentían
  // conectadas entre sí — ahora el proyecto es el encabezado del grupo, no
  // una etiqueta más. Lo sin proyecto asociado queda al final, bajo "Trabajo
  // independiente".
  const SIN_PROYECTO = "__independiente__";
  const gruposPortafolio: { key: string; titulo: string | null; items: typeof items }[] = [];
  {
    const indice = new Map<string, (typeof gruposPortafolio)[number]>();
    for (const it of items) {
      const key = it.project?.id ?? SIN_PROYECTO;
      let grupo = indice.get(key);
      if (!grupo) {
        grupo = { key, titulo: it.project?.titulo ?? null, items: [] };
        indice.set(key, grupo);
        gruposPortafolio.push(grupo);
      }
      grupo.items.push(it);
    }
    gruposPortafolio.sort((a, b) =>
      a.key === SIN_PROYECTO ? 1 : b.key === SIN_PROYECTO ? -1 : 0,
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      {/* Dos secciones reales, no una tarjeta centrada + una nota flotando al
          costado: el contenido (izquierda) se lleva la mayoría del ancho y
          es lo que manda; los enlaces (derecha) quedan en una columna angosta
          y fija (`sticky`) al lado — todo el conjunto se centra como una
          sola unidad en la página, en vez de que cada mitad tenga su propio
          centro. Por debajo de `xl` se apila en una sola columna. */}
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_16rem] xl:items-start xl:gap-10">
        <div>
          {/* Mismo lenguaje visual que el perfil público de una organización
              (`/organizaciones/[id]`): franja de color arriba, avatar
              superpuesto sobre esa franja, todo centrado. */}
          <header className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="h-20 bg-linear-to-br from-electric/15 to-electric/5 sm:h-24" />

        <div className="flex flex-col items-center px-6 pb-8 text-center sm:px-10">
          <span className="-mt-10 flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-electric text-xl font-semibold text-white ring-4 ring-white sm:-mt-12">
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

          <h1 className="mt-4 text-2xl font-bold text-ink">{profile.nombre}</h1>
          {profile.cargo && <p className="text-sm font-medium text-ink">{profile.cargo}</p>}
          {(profile.carrera || profile.semestre) && (
            <p className="text-sm text-muted">
              {profile.carrera}
              {profile.carrera && profile.semestre && " · "}
              {profile.semestre && `${profile.semestre}° semestre`}
            </p>
          )}

          {/* Resumen rápido, como su propio módulo (no más texto corrido
              mezclado con el resto): celdas con ícono, separadas por líneas
              — lo primero que necesita ver un visitante antes de leer todo
              lo demás. Con datos en cero (un perfil recién empezando) igual
              se muestra — es información honesta, no un error. Un
              patrocinador no tiene "proyectos completados" ni "evidencias"
              (son de estudiante, ver portafolio), así que solo se queda con
              la fecha de ingreso — mismo lenguaje visual, menos celdas. */}
          <div className="mt-6 flex w-full divide-x divide-border rounded-xl border border-border bg-surface/50">
            {!esPatrocinador && (
              <>
                <div className="flex flex-1 flex-col items-center gap-1 px-3 py-3.5">
                  <IconCompletado className="size-4 text-electric" />
                  <span className="text-lg font-bold text-ink">{proyectosCompletados}</span>
                  <span className="text-xs text-muted">
                    {proyectosCompletados === 1 ? "proyecto completado" : "proyectos completados"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col items-center gap-1 px-3 py-3.5">
                  <IconEvidencia className="size-4 text-electric" />
                  <span className="text-lg font-bold text-ink">{items.length}</span>
                  <span className="text-xs text-muted">
                    {items.length === 1 ? "evidencia" : "evidencias"}
                  </span>
                </div>
              </>
            )}
            <div className="flex flex-1 flex-col items-center gap-1 px-3 py-3.5">
              <IconCalendario className="size-4 text-electric" />
              <span className="text-xs font-semibold text-ink">
                {mesYAnio(profile.created_at)}
              </span>
              <span className="text-xs text-muted">En Vardelab desde</span>
            </div>
          </div>

          {profile.bio && (
            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Sobre mí
              </p>
              <p className="mt-1.5 max-w-md text-muted">{profile.bio}</p>
            </div>
          )}

          {/* Preferencias + habilidades: dos datos de la misma naturaleza ("qué
              busca, qué sabe hacer"), agrupados con un espacio más cerrado entre
              ellos que el que separa al resto de los bloques del encabezado. */}
          {(profile.intereses || skills.length > 0) && (
            <div className="mt-6 flex w-full flex-col items-center gap-4">
              {profile.intereses && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Preferencias de proyectos
                  </p>
                  <p className="mt-1.5 max-w-md text-sm text-ink">
                    {profile.intereses}
                  </p>
                </div>
              )}

              {skills.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Habilidades
                  </p>
                  {/* Color por nivel (antes las tres se veían idénticas, un
                      contorno gris) y avanzado primero — es lo que más le
                      importa ver a un patrocinador de un vistazo. */}
                  <div className="mt-1.5 flex flex-wrap justify-center gap-1.5">
                    {skillsOrdenadas.map((s) => (
                      <Badge
                        key={s.skill?.id ?? s.skill_id}
                        tone={s.nivel ? NIVEL_TONE[s.nivel] : "outline"}
                      >
                        {s.skill?.nombre}
                        {s.nivel && (
                          <span className="opacity-70">
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
            <div className="mt-6 flex flex-wrap items-center justify-center gap-5">
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
        </div>
          </header>

          {/* Portafolio: solo de estudiante — un patrocinador no tiene
              evidencias que mostrar, esta sección directamente no aplica. */}
          {!esPatrocinador && (
          <section className="mt-10">
        <h2 className="text-lg font-semibold text-ink">Portafolio</h2>
        {items.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center">
            <p className="text-sm text-muted">
              {esPropio
                ? "Todavía no hay evidencias — agrega alguna desde tu perfil para que se vea acá."
                : "Todavía no hay evidencias."}
            </p>
          </div>
        ) : (
          // Agrupado por proyecto — antes cada tarjeta repetía el mismo badge
          // de proyecto suelto; ahora el proyecto es el encabezado de su
          // grupo, y varias evidencias del mismo proyecto se leen como un
          // conjunto, no como filas sueltas sin relación entre sí.
          <div className="mt-4 flex flex-col gap-6">
            {gruposPortafolio.map((grupo) => (
              <div key={grupo.key}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  {grupo.titulo ?? "Trabajo independiente"}
                </p>
                <ul className="flex flex-col gap-3">
                  {grupo.items.map((it) => {
                    const IconoTipo = iconoDeTipo(it.url);
                    return (
                      <li
                        key={it.id}
                        className="flex items-start gap-4 rounded-2xl border border-border bg-white p-5 transition-colors hover:border-electric/30"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric/10 text-electric">
                          <IconoTipo className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-ink">{it.titulo}</span>
                          {it.descripcion && (
                            <p className="mt-1 text-sm text-muted">{it.descripcion}</p>
                          )}
                          {it.url && (
                            <a
                              href={it.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex min-w-0 items-center gap-1.5 text-sm font-medium text-electric hover:underline"
                            >
                              <IconEnlace className="size-3.5 shrink-0" />
                              <span className="truncate">{dominioDe(it.url)}</span>
                            </a>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
          </section>
          )}

          {/* No tiene sentido ofrecer reportar el propio perfil (y el server
              action ahora lo rechaza igual) — se oculta directamente. Va
              afuera de la sección de Portafolio: también aplica a un
              patrocinador, que no tiene esa sección. */}
          {!esPropio && (
            <div className="mt-8">
              <ReportButton targetType="perfil" targetId={profile.id} />
            </div>
          )}
        </div>

        {/* Columna angosta y fija (`sticky`): enlaces (visitante o dueño), un
            empujón a completar el perfil (si es el dueño y todavía falta
            algo) o una invitación a conocer la plataforma (si es visitante y
            todavía no hay enlaces que mostrar) — antes esta columna
            directamente desaparecía sin enlaces cargados, dejando ese lado de
            la página vacío justo cuando más útil sería (recién entrando, con
            el perfil recién creado). Solo en pantallas anchas — por debajo de
            `xl` esta columna desaparece (se apila) y los enlaces de arriba,
            dentro del encabezado, siguen cumpliendo la misma función. */}
        {(enlacesList.length > 0 || faltantes.length > 0 || (!esPropio && !esPatrocinador)) && (
          <aside className="mt-10 hidden xl:sticky xl:top-24 xl:mt-0 xl:flex xl:flex-col xl:gap-4">
            {enlacesList.length > 0 && (
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 text-sm shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Enlaces
                </p>
                {enlacesList.map((e) => (
                  <a
                    key={e.k}
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-medium text-electric hover:underline"
                  >
                    <PerfilIconSvg name={e.k} className="size-4 shrink-0" />
                    {ENLACE_LABEL[e.k]}
                  </a>
                ))}
              </div>
            )}

            {faltantes.length > 0 && (
              <div className="flex flex-col gap-2 rounded-xl border border-dashed border-electric/30 bg-electric/5 p-4 text-sm">
                <p className="font-semibold text-ink">Completa tu perfil</p>
                <ul className="flex flex-col gap-1.5 text-muted">
                  {faltantes.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Link
                  href="/perfil"
                  className="mt-1 font-medium text-electric hover:underline"
                >
                  Ir a mi perfil →
                </Link>
              </div>
            )}

            {/* Solo cuando no hay nada más que mostrarle a un visitante —
                si ya hay enlaces reales, esos alcanzan. El copy está escrito
                para quien visita el perfil de un ESTUDIANTE ("¿buscas
                talento?"); no tiene sentido si el perfil es de un
                patrocinador. */}
            {!esPropio && !esPatrocinador && enlacesList.length === 0 && (
              <div className="flex flex-col gap-2 rounded-xl border border-border bg-white p-4 text-sm shadow-sm">
                <p className="font-semibold text-ink">
                  ¿Buscas talento para tu proyecto?
                </p>
                <p className="text-muted">
                  Vardelab conecta estudiantes con organizaciones reales.
                </p>
                <Link
                  href="/proyectos"
                  className="mt-1 font-medium text-electric hover:underline"
                >
                  Explorar proyectos →
                </Link>
              </div>
            )}
          </aside>
        )}
      </div>
    </main>
  );
}
