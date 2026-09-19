import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { AppSidebar, type AppNavItem } from "@/components/app-sidebar";
import { SkipLink } from "@/components/skip-link";
import {
  getMyNotifications,
  getUnreadNotificationCount,
} from "@/features/notifications/queries";
import { NotificationsProvider } from "@/features/notifications/notifications-context";
import { NotificationToasts } from "@/features/notifications/components/notification-toasts";

// Todo lo que vive bajo `(app)` depende 100% de la sesión — nunca debe
// cachearse ni compartirse entre requests. Sin esto se reprodujo un bug real:
// justo después de iniciar sesión con una cuenta, `/inicio` alcanzó a mostrar
// por un instante el contenido de OTRO rol (sidebar y dashboard de
// "Estudiante" con el nombre correcto de una cuenta que es solo
// "Patrocinador") — una recarga simple ya mostraba lo correcto, lo que apunta
// a una respuesta cacheada del lado del servidor filtrándose entre sesiones,
// no a un dato mal guardado (los roles en la base estaban bien). `dynamic`
// desactiva el Full Route Cache y `fetchCache` fuerza que ningún `fetch` de
// esta rama (incluyendo los que hace el cliente de Supabase) se sirva desde
// el Data Cache. Se declaran acá porque `dynamic`/`fetchCache` son opciones
// de segmento que se heredan a todas las rutas hijas de este layout.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * Layout del área autenticada (dashboard por rol). Route group `(app)`: shell con
 * sidebar, separado del `(site)` público (header flotante). Guarda de sesión: sin
 * usuario, redirige a ingresar. La navegación se arma según el rol.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    // `x-pathname` la pone el middleware (ver lib/supabase/middleware.ts):
    // un layout no recibe la URL actual como prop, a diferencia de una page.
    // Sin esto, cada página de acá abajo perdía su propio `?next=` — este
    // guard corre primero y ganaba con un redirect a secas a /ingresar.
    const pathname = (await headers()).get("x-pathname") ?? "/inicio";
    redirect(`/ingresar?next=${pathname}`);
  }

  const [notifications, unreadCount] = await Promise.all([
    getMyNotifications(),
    getUnreadNotificationCount(),
  ]);

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
          { href: "/mis-reportes", label: "Mis reportes", icon: "reportes" },
        ] as AppNavItem[])
      : []),
    ...(user.esPatrocinador
      ? ([
          { href: "/mis-organizaciones", label: "Organizaciones", icon: "organizacion" },
          { href: "/mis-proyectos", label: "Mis proyectos", icon: "proyecto" },
          { href: "/postulaciones", label: "Postulaciones", icon: "postulaciones" },
          { href: "/mis-reportes", label: "Mis reportes", icon: "reportes" },
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
      ? ([
          { href: "/admin", label: "Métricas", icon: "admin" },
          { href: "/admin/proyectos", label: "Proyectos", icon: "proyecto" },
          { href: "/admin/organizaciones", label: "Organizaciones", icon: "organizacion" },
          { href: "/admin/catalogos", label: "Catálogos", icon: "catalogos" },
          { href: "/admin/usuarios", label: "Usuarios", icon: "usuarios" },
          { href: "/admin/auditoria", label: "Auditoría", icon: "auditoria" },
          { href: "/admin/configuracion", label: "Configuración", icon: "configuracion" },
        ] as AppNavItem[])
      : []),
  ];

  return (
    <NotificationsProvider
      userId={user.id}
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
    >
      <div className="min-h-screen bg-surface lg:flex">
        <SkipLink />
        <AppSidebar
          user={{
            nombre: user.nombre,
            initials: iniciales(user.nombre),
            avatarUrl: user.avatarUrl,
            roleLabel,
          }}
          items={items}
          exploreItem={{ href: "/proyectos", label: "Explorar catálogo", icon: "explorar" }}
        />
        <main id="contenido-principal" tabIndex={-1} className="min-w-0 flex-1">
          {children}
        </main>
      </div>
      <NotificationToasts />
    </NotificationsProvider>
  );
}

// Iniciales para el avatar: primeras letras de hasta dos palabras del nombre.
function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  const ini = partes.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return ini || "?";
}
