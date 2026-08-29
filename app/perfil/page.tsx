import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMyProfile } from "@/features/profile/queries";
import { ProfileForm } from "@/features/profile/components/profile-form";

export const metadata: Metadata = {
  title: "Mi perfil · CampusLab",
};

/** Edición del perfil propio. Requiere sesión. */
export default async function PerfilPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/ingresar?next=/perfil");

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
    </main>
  );
}
