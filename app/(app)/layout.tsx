import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { AppSidebar, type AppNavItem } from "@/components/app-sidebar";

/**
 * Layout del área autenticada (dashboard por rol). Route group `(app)`: shell con
 * sidebar, separado del `(site)` público (header flotante). Guarda de sesión: sin
 * usuario, redirige a ingresar. La navegación se arma según el rol.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");

  const roleLabel =
    user.esModerador || user.esAdmin
      ? "Moderador"
      : user.esPatrocinador
        ? "Patrocinador"
        : "Estudiante";

  // Navegación según el rol. "Inicio", "Explorar" y "Perfil" son transversales.
  const items: AppNavItem[] = [
    { href: "/inicio", label: "Inicio", icon: "inicio" },
    { href: "/proyectos", label: "Explorar", icon: "explorar" },
    ...(user.esEstudiante
      ? ([
          { href: "/mis-postulaciones", label: "Postulaciones", icon: "postulaciones" },
        ] as AppNavItem[])
      : []),
    ...(user.esPatrocinador
      ? ([
          { href: "/mis-proyectos", label: "Mis proyectos", icon: "proyecto" },
        ] as AppNavItem[])
      : []),
    ...(user.esModerador || user.esAdmin
      ? ([{ href: "/moderacion", label: "Moderación", icon: "moderacion" }] as AppNavItem[])
      : []),
    { href: "/perfil", label: "Perfil", icon: "perfil" },
  ];

  return (
    <div className="min-h-screen bg-surface lg:flex">
      <AppSidebar
        user={{ nombre: user.nombre, initials: iniciales(user.nombre), roleLabel }}
        items={items}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

// Iniciales para el avatar: primeras letras de hasta dos palabras del nombre.
function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  const ini = partes.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return ini || "?";
}
