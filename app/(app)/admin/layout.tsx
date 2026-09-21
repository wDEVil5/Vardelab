import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";

/**
 * Guarda de rol para toda la sección `/admin`. Antes se repetía
 * `if (!user.esAdmin) redirect("/")` en cada `page.tsx` (9 veces) — una
 * página nueva sin esa línea quedaba abierta a cualquier sesión. La guarda de
 * sesión (sin usuario → `/ingresar`) ya la hace `app/(app)/layout.tsx`, así
 * que acá solo falta el chequeo de rol.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user?.esAdmin) redirect("/");
  return children;
}
