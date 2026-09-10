import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { getAllLeads } from "@/features/leads/queries";
import { LeadsTable } from "@/features/leads/components/leads-table";

export const metadata: Metadata = {
  title: "Leads · CampusLab",
};

/**
 * Panel de leads (Fase 1 · captación): "Hablar con CampusLab" y "Proponer un
 * desafío" llegan aquí. Guarda de acceso por rol; la RLS `leads_select_staff`
 * (M17) además limita la lectura a moderador/admin.
 */
export default async function LeadsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  if (!user.esModerador && !user.esAdmin) redirect("/");

  const leads = await getAllLeads();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 lg:py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Leads</h1>
        <p className="text-sm text-muted">
          Contactos de organizaciones y propuestas de desafío.
        </p>
      </header>

      <div className="mt-8">
        <LeadsTable leads={leads} />
      </div>
    </div>
  );
}
