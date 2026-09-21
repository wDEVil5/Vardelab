import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";

/**
 * Guarda de rol para `/leads`. Mismo patrón que `/admin` y `/moderacion`:
 * hoy es una sola página, pero centralizar acá evita el mismo riesgo si se
 * agrega una segunda ruta bajo esta sección.
 */
export default async function LeadsLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user?.esModerador && !user?.esAdmin) redirect("/");
  return children;
}
