import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { getSkillsCatalog, getModalidadUsage } from "@/features/admin/queries";
import { CatalogosTabs } from "@/features/admin/components/catalogos-tabs";

export const metadata: Metadata = {
  title: "Gestión de catálogos · CampusLab",
};

/**
 * Gestión de catálogos (D-02, deseable). Solo "Habilidades" es una tabla real
 * con CRUD (`skills`, M2); "Categorías" y "Modalidades" son vistas derivadas
 * (ver el comentario en `CatalogosTabs`), no entidades propias — el mockup
 * las trata como tres catálogos simétricos, pero el modelo real no lo es.
 */
export default async function AdminCatalogosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  if (!user.esAdmin) redirect("/");

  const [skills, modalidades] = await Promise.all([getSkillsCatalog(), getModalidadUsage()]);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10 lg:py-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Gestión de catálogos
        </h1>
        <p className="mt-1.5 text-muted">
          Mantén opciones consistentes para perfiles y proyectos.
        </p>
      </header>

      <div className="mt-9">
        <CatalogosTabs skills={skills} modalidades={modalidades} />
      </div>
    </div>
  );
}
