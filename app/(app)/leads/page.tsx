import type { Metadata } from "next";
import { getLeadCountsByEstado, getLeadsPage } from "@/features/leads/queries";
import { LeadsTable } from "@/features/leads/components/leads-table";

export const metadata: Metadata = {
  title: "Leads · Vardelab",
};

type PageProps = {
  searchParams: Promise<{ estado?: string; page?: string }>;
};

const ESTADOS_VALIDOS = ["nuevo", "contactado", "descartado", "todos"] as const;

/**
 * Panel de leads (Fase 1 · captación): "Hablar con Vardelab" y "Proponer un
 * desafío" llegan aquí. Guarda de acceso por rol; la RLS `leads_select_staff`
 * (M17) además limita la lectura a moderador/admin.
 *
 * Paginación real: antes traía TODOS los leads históricos y los filtraba en
 * el cliente — con meses de captación acumulada se vuelve una lista
 * interminable, mismo hallazgo que en proyectos/organizaciones del admin.
 */
export default async function LeadsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const estado = ESTADOS_VALIDOS.includes(sp.estado as (typeof ESTADOS_VALIDOS)[number])
    ? (sp.estado as (typeof ESTADOS_VALIDOS)[number])
    : "nuevo";

  const [{ leads, total, pageSize }, conteos] = await Promise.all([
    getLeadsPage(page, estado),
    getLeadCountsByEstado(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    // Mismo patrón que /moderacion, /moderacion/reportes, /admin/*: encabezado
    // fijo, solo la lista de abajo scrollea.
    <div className="mx-auto flex w-full max-w-3xl flex-col px-6 py-8 lg:h-dvh lg:py-10">
      <header className="shrink-0 flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">Leads</h1>
        <p className="text-sm text-muted">
          Contactos de organizaciones y propuestas de desafío.
        </p>
      </header>

      <div className="mt-8 flex min-h-0 flex-1 flex-col lg:overflow-hidden">
        <LeadsTable
          leads={leads}
          total={total}
          page={page}
          totalPages={totalPages}
          estado={estado}
          conteos={conteos}
        />
      </div>
    </div>
  );
}
