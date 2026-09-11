import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { AppSidebar, type AppNavItem } from "@/components/app-sidebar";
import { SkipLink } from "@/components/skip-link";

/**
 * Layout del área autenticada (dashboard por rol). Route group `(app)`: shell con
 * sidebar, separado del `(site)` público (header flotante). Guarda de sesión: sin
 * usuario, redirige a ingresar. La navegación se arma según el rol.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");

  const roleLabel = user.esAdmin
    ? "Administrador"
    : user.esModerador
      ? "Moderador"
      : user.esPatrocinador
        ? "Patrocinador"
        : "Estudiante";

  // Navegación según el rol. "Inicio" y "Perfil" son transversales. "Explorar"
  // se arma aparte (ver `exploreItem` más abajo): apunta al catálogo público
  // (`/proyectos`, sin el shell), así que el sidebar lo separa visualmente del
  // resto en vez de mezclarlo como si fuera una sección interna más.
  const items: AppNavItem[] = [
    { href: "/inicio", label: "Inicio", icon: "inicio" },
    ...(user.esEstudiante
      ? ([
          { href: "/proyecto", label: "Proyecto", icon: "proyecto" },
          { href: "/mis-postulaciones", label: "Postulaciones", icon: "postulaciones" },
        ] as AppNavItem[])
      : []),
    ...(user.esPatrocinador
      ? ([
          { href: "/mis-organizaciones", label: "Organizaciones", icon: "organizacion" },
          { href: "/mis-proyectos", label: "Mis proyectos", icon: "proyecto" },
        ] as AppNavItem[])
      : []),
    ...(user.esModerador || user.esAdmin
      ? ([
          { href: "/moderacion", label: "Moderación", icon: "moderacion" },
          { href: "/moderacion/reportes", label: "Reportes", icon: "reportes" },
          { href: "/leads", label: "Leads", icon: "leads" },
        ] as AppNavItem[])
      : []),
    ...(user.esAdmin
      ? ([{ href: "/admin", label: "Métricas", icon: "admin" }] as AppNavItem[])
      : []),
  ];

  return (
    <div className="min-h-screen bg-surface lg:flex">
      <SkipLink />
      <AppSidebar
        user={{ nombre: user.nombre, initials: iniciales(user.nombre), roleLabel }}
        items={items}
        exploreItem={{ href: "/proyectos", label: "Explorar catálogo", icon: "explorar" }}
      />
      <main id="contenido-principal" tabIndex={-1} className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}

// Iniciales para el avatar: primeras letras de hasta dos palabras del nombre.
function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  const ini = partes.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return ini || "?";
}
