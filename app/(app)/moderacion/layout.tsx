import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";

/**
 * Guarda de rol para toda la sección `/moderacion`. Antes se repetía
 * `if (!user.esModerador && !user.esAdmin) redirect("/")` en cada `page.tsx`
 * (4 veces) — mismo riesgo que en `/admin`: una página nueva sin esa línea
 * quedaba abierta a cualquier sesión.
 */
export default async function ModeracionLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user?.esModerador && !user?.esAdmin) redirect("/");
  return children;
}
