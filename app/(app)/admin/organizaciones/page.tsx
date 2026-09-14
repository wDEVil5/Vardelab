import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { getOrganizationsForAdmin } from "@/features/admin/queries";
import { OrganizationsTable } from "@/features/admin/components/organizations-table";

export const metadata: Metadata = {
  title: "Organizaciones · CampusLab",
};

/**
 * Lista de todas las organizaciones del piloto (hallazgo al revisar los
 * badges de "verificado"): el enum `verification_status` existía desde M8,
 * pero ninguna pantalla de admin las listaba ni había forma de aprobar una
 * solicitud. Desde acá se entra al detalle (`/admin/organizaciones/[id]`),
 * que es donde vive aprobar/rechazar (M62).
 */
export default async function AdminOrganizacionesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  if (!user.esAdmin) redirect("/");

  const orgs = await getOrganizationsForAdmin();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Organizaciones</h1>
        <p className="mt-1.5 text-muted">
          Todas las organizaciones del piloto y su estado de verificación.
        </p>
      </header>

      <div className="mt-9">
        <OrganizationsTable orgs={orgs} />
      </div>
    </div>
  );
}
