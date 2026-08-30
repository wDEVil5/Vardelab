import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { getMyProfile, getMyProfileSkills } from "@/features/profile/queries";
import { setProfileVisibility } from "@/features/profile/actions";
import { getActiveSkills } from "@/features/skills/queries";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { ProfileSkillsEditor } from "@/features/profile/components/profile-skills-editor";

export const metadata: Metadata = {
  title: "Mi perfil · CampusLab",
};

/** Edición del perfil propio. Requiere sesión. */
export default async function PerfilPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/ingresar?next=/perfil");

  const [profileSkills, catalog] = await Promise.all([
    getMyProfileSkills(),
    getActiveSkills(),
  ]);

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Mi perfil</h1>
        <p className="text-sm text-muted">
          Completa tu perfil: ayuda a que los patrocinadores te conozcan al
          revisar tus postulaciones.
        </p>
      </header>

      <div className="mt-8">
        <ProfileForm profile={profile} />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-ink">Mis habilidades</h2>
        <p className="mt-1 text-sm text-muted">
          Declara lo que sabes hacer y tu nivel. Ayuda a que te encuentren para
          los roles indicados.
        </p>
        <div className="mt-4">
          <ProfileSkillsEditor skills={profileSkills} catalog={catalog} />
        </div>
      </section>

      {/* Visibilidad del perfil: habilita (o no) la página pública /u/[id]. */}
      <section className="mt-10">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-ink">Perfil público</h2>
          <Badge tone={profile.visibility === "publico" ? "success" : "neutral"}>
            {profile.visibility === "publico" ? "Público" : "Privado"}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted">
          {profile.visibility === "publico"
            ? "Tu perfil y tus evidencias públicas son visibles para cualquiera con el enlace."
            : "Tu perfil es privado. Hazlo público para compartir tu portafolio."}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <form action={setProfileVisibility}>
            <input
              type="hidden"
              name="visibility"
              value={profile.visibility === "publico" ? "privado" : "publico"}
            />
            <button
              type="submit"
              className={buttonClasses({
                variant: profile.visibility === "publico" ? "secondary" : "primary",
                size: "sm",
              })}
            >
              {profile.visibility === "publico"
                ? "Hacer privado"
                : "Hacer público"}
            </button>
          </form>

          {profile.visibility === "publico" && (
            <Link
              href={`/u/${profile.id}`}
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              Ver mi página pública
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
