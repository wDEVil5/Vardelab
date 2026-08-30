import type { Metadata } from "next";
import { RegistroView } from "@/features/auth/components/registro-view";

export const metadata: Metadata = {
  title: "Crear cuenta · CampusLab",
};

/** A-01 · Registro. La vista es cliente: el rol elegido adapta el panel. */
export default function RegistroPage() {
  return <RegistroView />;
}
