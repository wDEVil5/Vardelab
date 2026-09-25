import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";

/** Destino inicial por rol, sin cambiar lo que muestra /inicio al navegar. */
export default async function EntradaPage() {
  const user = await getCurrentUser();
  redirect(user?.esAdmin ? "/admin" : "/inicio");
}
