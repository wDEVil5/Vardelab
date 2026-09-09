import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { getMyApplications } from "@/features/applications/queries";
import { ApplicationsTable } from "@/features/applications/components/applications-table";

export const metadata: Metadata = {
  title: "Mis postulaciones · CampusLab",
};

/**
 * S-04 · Embudo de postulaciones del estudiante: una tabla con el estado de cada
 * una (enviada, aceptada, cerrada), filtrable. Es solo seguimiento; el trabajo
 * del proyecto (equipo, hitos y entregas) vive en "En curso". Requiere sesión.
 */
export default async function MisPostulacionesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?next=/mis-postulaciones");

  const apps = await getMyApplications();

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 lg:py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Mis postulaciones</h1>
        <p className="text-sm text-muted">Sigue el estado de tus oportunidades.</p>
      </header>

      <div className="mt-8">
        <ApplicationsTable apps={apps} />
      </div>
    </div>
  );
}
