import { isRegistroAbierto } from "@/features/auth/queries";
import { AuthRolProvider } from "@/features/auth/components/auth-rol-context";
import { RegistroView } from "@/features/auth/components/registro-view";
import type { Rol } from "@/features/auth/components/signup-form";

/**
 * Versión modal de /registro (intercepting route): ver (.)ingresar/page.tsx
 * y layout.tsx (el marco del modal vive ahí, no acá).
 */
type PageProps = { searchParams: Promise<{ rol?: string }> };

export default async function RegistroModal({ searchParams }: PageProps) {
  const { rol } = await searchParams;
  const initialRol: Rol = rol === "patrocinador" ? "patrocinador" : "estudiante";
  const registroAbierto = await isRegistroAbierto("RegistroModal");

  return (
    <AuthRolProvider>
      <RegistroView initialRol={initialRol} registroAbierto={registroAbierto} isModal />
    </AuthRolProvider>
  );
}
