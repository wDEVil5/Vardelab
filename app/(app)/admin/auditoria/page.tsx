import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { getAuditLog } from "@/features/admin/queries";
import { AuditLogTable } from "@/features/admin/components/audit-log-table";

export const metadata: Metadata = {
  title: "Registro de auditoría · CampusLab",
};

/** ¿Este evento otorgó el rol `admin`? Es lo más sensible que hoy se audita. */
function esOtorgamientoDeAdmin(metadata: unknown): boolean {
  return (
    !!metadata &&
    typeof metadata === "object" &&
    (metadata as { rol_nuevo?: unknown }).rol_nuevo === "admin"
  );
}

/**
 * Registro de auditoría (D-04, RF-17). Le da uso por primera vez a
 * `audit_logs` (existía desde M7, sin escritores hasta el panel de usuarios
 * de D-03). Muestra los últimos 200 eventos. "Eventos críticos" no es un
 * campo del modelo: se define como otorgar el rol `admin` (la acción más
 * sensible que hoy se audita), no un contador decorativo en cero.
 */
export default async function AdminAuditoriaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  if (!user.esAdmin) redirect("/");

  const eventos = await getAuditLog();

  const cambiosDeRol = eventos.filter((e) => e.accion === "rol_actualizado").length;
  const suspensiones = eventos.filter((e) => e.accion === "cuenta_suspendida").length;
  const criticos = eventos.filter(
    (e) => e.accion === "rol_actualizado" && esOtorgamientoDeAdmin(e.metadata),
  ).length;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Registro de auditoría
        </h1>
        <p className="mt-1.5 text-muted">
          Trazabilidad de cambios sensibles, sin almacenar secretos ni contenido privado.
        </p>
      </header>

      <div className="mt-9 grid grid-cols-2 gap-5 lg:grid-cols-4">
        <Kpi value={eventos.length} label="Eventos registrados" />
        <Kpi value={cambiosDeRol} label="Cambios de rol" tone="brand" />
        <Kpi value={suspensiones} label="Suspensiones" tone="danger" />
        <Kpi
          value={criticos}
          label="Otorgamientos de admin"
          tone={criticos > 0 ? "danger" : "success"}
        />
      </div>

      <div className="mt-9">
        <AuditLogTable eventos={eventos} />
      </div>
    </div>
  );
}

const TONE_CLASSES = {
  ink: "border-border bg-white text-ink",
  brand: "border-electric/20 bg-electric/10 text-electric",
  danger: "border-coral/20 bg-coral/10 text-coral",
  success: "border-sprout/30 bg-sprout/15 text-ink",
} as const;

function Kpi({
  value,
  label,
  tone = "ink",
}: {
  value: number;
  label: string;
  tone?: keyof typeof TONE_CLASSES;
}) {
  return (
    <div className={`rounded-2xl border p-6 ${TONE_CLASSES[tone]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-1.5 text-sm text-muted">{label}</p>
    </div>
  );
}
