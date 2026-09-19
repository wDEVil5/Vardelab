import type { Metadata } from "next";
import { isRegistroAbierto } from "@/features/auth/queries";
import { RegistroView } from "@/features/auth/components/registro-view";
import type { Rol } from "@/features/auth/components/signup-form";

export const metadata: Metadata = {
  title: "Crear cuenta · Vardelab",
};

type PageProps = { searchParams: Promise<{ rol?: string }> };

/**
 * A-01 · Registro. El split y el peek viven en el layout de credenciales.
 */
export default async function RegistroPage({ searchParams }: PageProps) {
  const { rol } = await searchParams;
  const initialRol: Rol = rol === "patrocinador" ? "patrocinador" : "estudiante";
  const registroAbierto = await isRegistroAbierto("RegistroPage");

  return (
    <RegistroView initialRol={initialRol} registroAbierto={registroAbierto} />
  );
}
