import type { Metadata } from "next";
import { RegistroView } from "@/features/auth/components/registro-view";
import type { Rol } from "@/features/auth/components/signup-form";

export const metadata: Metadata = {
  title: "Crear cuenta · CampusLab",
};

type PageProps = { searchParams: Promise<{ rol?: string }> };

/**
 * A-01 · Registro. La vista es cliente: el rol elegido adapta el panel. El rol
 * inicial puede venir por `?rol=` (p. ej. "Soy una organización" → patrocinador).
 */
export default async function RegistroPage({ searchParams }: PageProps) {
  const { rol } = await searchParams;
  const initialRol: Rol = rol === "patrocinador" ? "patrocinador" : "estudiante";

  return <RegistroView initialRol={initialRol} />;
}
