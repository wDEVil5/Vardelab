import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import {
  getOrganizationsForAdminPage,
  getPendingOrgVerificationCount,
} from "@/features/admin/queries";
import { OrganizationsTable } from "@/features/admin/components/organizations-table";

export const metadata: Metadata = {
  title: "Organizaciones · CampusLab",
};

type PageProps = {
  searchParams: Promise<{ q?: string; verificacion?: string; page?: string }>;
};

/**
 * Lista de todas las organizaciones del piloto (hallazgo al revisar los
 * badges de "verificado"): el enum `verification_status` existía desde M8,
 * pero ninguna pantalla de admin las listaba ni había forma de aprobar una
 * solicitud. Desde acá se entra al detalle (`/admin/organizaciones/[id]`),
 * que es donde vive aprobar/rechazar (M62).
 *
 * Paginación real (M80), mismo patrón que /admin/proyectos (M79): antes
 * traía TODAS las organizaciones y las filtraba en el cliente — con volumen
 * real (prueba de carga) la tabla se volvía una lista interminable.
 */
export default async function AdminOrganizacionesPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  if (!user.esAdmin) redirect("/");

  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const filters = { q: sp.q, verificacion: sp.verificacion };

  const [{ orgs, total, pageSize }, pendientes] = await Promise.all([
    getOrganizationsForAdminPage(page, filters),
    getPendingOrgVerificationCount(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-6 lg:h-dvh lg:py-8">
      <header className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Organizaciones</h1>
        <p className="mt-1.5 text-muted">
          Todas las organizaciones del piloto y su estado de verificación.
        </p>
      </header>

      <div className="mt-6 flex min-h-0 flex-1 flex-col lg:overflow-hidden">
        <OrganizationsTable
          orgs={orgs}
          total={total}
          page={page}
          totalPages={totalPages}
          filters={filters}
          pendientes={pendientes}
        />
      </div>
    </div>
  );
}
