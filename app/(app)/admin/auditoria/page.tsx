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
    // `lg:h-dvh` + `lg:flex lg:flex-col`: en desktop, la página ocupa el alto
    // completo del viewport para que la tabla y el panel de detalle de
    // `AuditLogTable` puedan repartirse ese espacio fijo entre ellos — la
    // tabla scrollea internamente, el detalle queda siempre visible abajo sin
    // depender de cuántas filas haya. `h-dvh` (no `calc(100dvh - padding)`):
    // el padding ya vive dentro de ese alto por `border-box`, restarlo aparte
    // dejaba ~80px de espacio muerto sin usar debajo de todo el contenido. En
    // mobile se deja el flujo normal (la página entera scrollea): con la
    // tabla ya convertida en tarjetas apiladas ahí, no hay un "panel de
    // detalle lejano" que resolver de la misma forma.
    <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-8 lg:h-dvh lg:py-10">
      <header className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Registro de auditoría
        </h1>
        <p className="mt-1.5 text-muted">
          Trazabilidad de cambios sensibles, sin almacenar secretos ni contenido privado.
        </p>
      </header>

      <div className="mt-6 grid shrink-0 grid-cols-2 gap-5 lg:grid-cols-4">
        <Kpi value={eventos.length} label="Eventos registrados" />
        <Kpi value={cambiosDeRol} label="Cambios de rol" tone="brand" />
        <Kpi value={suspensiones} label="Suspensiones" tone="danger" />
        <Kpi
          value={criticos}
          label="Otorgamientos de admin"
          tone={criticos > 0 ? "danger" : "success"}
        />
      </div>

      <div className="mt-6 flex min-h-0 flex-1 flex-col">
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
