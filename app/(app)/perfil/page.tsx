import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/features/auth/queries";
import {
  getMyProfile,
  getMyProfileCompletion,
  getAvatarPresets,
  getMyProfileSkills,
  type ProfileLinks,
  type AvatarPreset,
} from "@/features/profile/queries";
import { setProfileVisibility } from "@/features/profile/actions";
import { VisibilityToggle } from "@/features/profile/components/visibility-toggle";
import { AvatarPicker } from "@/features/profile/components/avatar-picker";
import { PerfilIconSvg, type PerfilIcon } from "@/features/profile/components/profile-icons";
import { getActiveSkills } from "@/features/skills/queries";
import { getMyPortfolioItems } from "@/features/portfolio/queries";
import { getMyTeams } from "@/features/teams/queries";
import { EditProfileDialog } from "@/features/profile/components/edit-profile-dialog";
import { EditPatrocinadorProfileDialog } from "@/features/profile/components/edit-patrocinador-profile-dialog";
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

// Campo de solo lectura: ícono en círculo + etiqueta + valor (o un guion si
// falta), en fila. Antes era una lista de definición pelada — el ícono le da
// una referencia visual a cada campo, igual que las tarjetas KPI de /inicio.
function Campo({
  icon,
  label,
  valor,
}: {
  icon: PerfilIcon;
  label: string;
  valor: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-muted">
        <PerfilIconSvg name={icon} />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm text-ink">
          {valor?.trim() ? valor : <span className="text-muted">—</span>}
        </dd>
      </div>
    </div>
  );
}

// Título de sección con el mismo ícono-en-círculo que Campo, para que las
// tarjetas de la derecha (Habilidades, Portafolio) no queden como simples
// encabezados pelados.
function SectionTitle({
  icon,
  titulo,
  descripcion,
}: {
  icon: PerfilIcon;
  titulo: string;
  descripcion: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-muted">
        <PerfilIconSvg name={icon} />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-ink">{titulo}</h2>
        <p className="mt-1 text-sm text-muted">{descripcion}</p>
      </div>
    </div>
  );
}

/** Edición del perfil propio, distribuida en tarjetas. Requiere sesión. */
export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?next=/perfil");

  // Un patrocinador puro no tiene carrera, habilidades ni portafolio — antes
  // veía el editor de estudiante completo (con el "% de perfil completo"
  // pidiéndole Carrera/Semestre/Habilidades), que no le servía de nada. Su
  // identidad pública real la administra en su organización (S-01 del Figma).
  if (user.esPatrocinador && !user.esEstudiante) {
    const avatarPresets = await getAvatarPresets();
    return (
      <PerfilPatrocinador
        nombre={user.nombre}
        email={user.email}
        avatarUrl={user.avatarUrl}
        avatarPresets={avatarPresets}
      />
    );
  }

  const profile = await getMyProfile();
  if (!profile) redirect("/ingresar?next=/perfil");

  const [profileSkills, catalog, portfolio, teams, completion, avatarPresets] =
    await Promise.all([
      getMyProfileSkills(),
      getActiveSkills(),
      getMyPortfolioItems(),
      getMyTeams(),
      getMyProfileCompletion(),
      getAvatarPresets(),
    ]);
  const pct = completion?.pct ?? 100;
  const faltan = completion?.faltan ?? [];

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
        <h1 className="text-2xl font-bold text-ink">
          Hola, {profile.nombre?.split(/\s+/)[0] || "estudiante"}.
        </h1>
        <p className="text-sm text-muted">
          Información que ven los patrocinadores al revisar tus postulaciones.
        </p>
      </header>

      {/* Tarjeta de identidad: resumen, completitud y visibilidad juntos —
          antes eran dos tarjetas blancas casi idénticas una sobre otra. */}
      <section className="mt-6 rounded-2xl border border-border bg-white p-6">
        <div className="flex flex-wrap items-start gap-4">
          <AvatarPicker
            avatarUrl={profile.avatar_url}
            iniciales={iniciales(profile.nombre)}
            presets={avatarPresets}
          />
          <div className="min-w-0 flex-1">
            {/* El botón de editar va junto al nombre, no anclado en la
                esquina de la tarjeta: antes dejaba un vacío enorme en el
                medio en pantallas anchas. */}
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-xl font-bold text-ink">
                {profile.nombre || "Sin nombre"}
              </p>
              <EditProfileDialog profile={profile} />
            </div>
            {(profile.carrera || profile.semestre) && (
              <p className="text-sm text-muted">
                {profile.carrera}
                {profile.carrera && profile.semestre != null && " · "}
                {profile.semestre != null && `${profile.semestre}° semestre`}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone={esPublico ? "success" : "neutral"}>
                {esPublico ? "Perfil público" : "Perfil privado"}
              </Badge>
              {pct < 100 && <Badge tone="brand">{pct}% completo</Badge>}
            </div>

            {/* Barra de progreso: el número solo ("67% completo") no da una
                sensación inmediata de cuánto falta; el trazo sí. */}
            {pct < 100 && (
              <div
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Perfil completo"
                className="mt-2 h-1.5 w-full max-w-56 overflow-hidden rounded-full bg-surface"
              >
                <div
                  className="h-full rounded-full bg-electric transition-[width]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {pct < 100 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Te falta
            </span>
            {faltan.map((f) => (
              <Badge key={f} tone="outline">
                {f}
              </Badge>
            ))}
          </div>
        )}

        {/* Visibilidad: un ajuste, no un panel — una línea de texto y un
            switch, sin ícono, sin botón de texto ni caja aparte. Minimalista
            a propósito: es una preferencia que se prende o apaga, no una
            acción que necesite tanto peso visual. */}
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-5">
          <p className="text-sm text-muted">
            {esPublico
              ? "Tu perfil es visible para cualquiera con el enlace."
              : "Tu perfil es privado; solo tú lo ves."}
          </p>
          <div className="flex items-center gap-4">
            {esPublico && (
              <Link
                href={`/u/${profile.id}`}
                className="text-sm font-medium text-electric hover:underline"
              >
                Ver perfil público
              </Link>
            )}
            <VisibilityToggle checked={esPublico} action={setProfileVisibility} />
          </div>
        </div>
      </section>

      {/* Dos bloques: izquierda los datos (un solo form), derecha lo demás. */}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        {/* Bloque izquierdo: datos en solo lectura (se editan con "Editar perfil"). */}
        <section className="rounded-2xl border border-border bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">Tus datos</h2>
          <dl className="mt-4 flex flex-col gap-4">
            <Campo icon="bio" label="Presentación" valor={profile.bio} />
            <Campo
              icon="intereses"
              label="Preferencias de proyectos"
              valor={profile.intereses}
            />
            <Campo
              icon="disponibilidad"
              label="Disponibilidad"
              valor={profile.disponibilidad}
            />
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-muted">
                <PerfilIconSvg name="enlaces" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                  Enlaces
                </dt>
                <dd className="mt-0.5">
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
            </div>
          </dl>
        </section>

        {/* Bloque derecho: habilidades y portafolio apilados. */}
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-border bg-white p-6">
            <SectionTitle
              icon="habilidades"
              titulo="Habilidades"
              descripcion="Lo que sabes hacer y tu nivel: ayuda a que te encuentren."
            />
            <div className="mt-4">
              <ProfileSkillsEditor skills={profileSkills} catalog={catalog} />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-6">
            <SectionTitle
              icon="portafolio"
              titulo="Portafolio"
              descripcion="Reúne tus evidencias y decide cuáles mostrar. Ligar una evidencia a un proyecto que integraste la vuelve verificable."
            />
            <div className="mt-4">
              <PortfolioEditor items={portfolio} projects={projectOptions} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/**
 * Versión mínima del perfil para una cuenta de patrocinador puro: identidad
 * básica (nombre, correo, avatar) y un enlace a su organización, que es donde
 * realmente administra lo que ven los estudiantes (S-01 del Figma). Sin
 * carrera/habilidades/portafolio ni el medidor de "% completo" — nada de eso
 * aplica a una organización.
 */
function PerfilPatrocinador({
  nombre,
  email,
  avatarUrl,
  avatarPresets,
}: {
  nombre: string;
  email: string;
  avatarUrl: string | null;
  avatarPresets: AvatarPreset[];
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8 lg:py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">
          Hola, {nombre.split(/\s+/)[0] || "patrocinador"}.
        </h1>
        <p className="text-sm text-muted">Tu información de cuenta en CampusLab.</p>
      </header>

      <section className="mt-6 rounded-2xl border border-border bg-white p-6">
        <div className="flex flex-wrap items-center gap-4">
          <AvatarPicker
            avatarUrl={avatarUrl}
            iniciales={iniciales(nombre)}
            presets={avatarPresets}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-xl font-bold text-ink">{nombre}</p>
              <EditPatrocinadorProfileDialog nombre={nombre} />
            </div>
            <p className="mt-1 text-sm text-muted">{email}</p>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-white p-6">
        <h2 className="text-lg font-semibold text-ink">Tu organización</h2>
        <p className="mt-1 text-sm text-muted">
          El nombre, la descripción y los datos de contacto que ven los
          estudiantes al revisar tus proyectos se administran desde tu
          organización, no desde acá.
        </p>
        <Link
          href="/mis-organizaciones"
          className={cn(buttonClasses({ variant: "outline", size: "sm" }), "mt-4")}
        >
          Ir a mis organizaciones
        </Link>
      </section>
    </div>
  );
}
