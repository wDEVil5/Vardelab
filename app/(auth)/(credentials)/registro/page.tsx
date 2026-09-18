import type { Metadata } from "next";
import { RegistroView } from "@/features/auth/components/registro-view";
import type { Rol } from "@/features/auth/components/signup-form";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pilot_registro_abierto");

  if (error) {
    console.error("[RegistroPage:pilot_registro_abierto]", error.message);
  }

  const registroAbierto = error ? true : data !== false;

  return (
    <RegistroView initialRol={initialRol} registroAbierto={registroAbierto} />
  );
}
