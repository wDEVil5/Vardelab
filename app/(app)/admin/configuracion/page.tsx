import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { getPilotConfig } from "@/features/admin/queries";
import { PilotConfigForm } from "@/features/admin/components/pilot-config-form";

export const metadata: Metadata = {
  title: "Configuración del piloto · CampusLab",
};

/**
 * Configuración del piloto (D-05, deseable). Ver M24 y `updatePilotConfig`
 * para qué campos cambian comportamiento real (registro abierto/cerrado,
 * moderación previa, autoaprobación, patrocinadores externos) y cuáles solo
 * quedan guardados y auditados por ahora (límites de alcance, notificaciones
 * — el envío real depende del correo transaccional, aún pendiente).
 */
export default async function AdminConfiguracionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  if (!user.esAdmin) redirect("/");

  const config = await getPilotConfig();
  if (!config) redirect("/admin");

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Configuración del piloto
        </h1>
        <p className="mt-1.5 text-muted">
          Ajusta parámetros operativos sin modificar código; todo cambio queda auditado.
        </p>
      </header>

      <div className="mt-9">
        {/* key: fuerza a remontar el formulario con el estado local limpio
            cuando `updated_at` cambia (tras un guardado exitoso). */}
        <PilotConfigForm key={config.updated_at} config={config} />
      </div>
    </div>
  );
}
