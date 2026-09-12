"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { buttonClasses } from "@/components/ui/button";
import { MobileMenu, type MobileNavItem } from "@/components/mobile-menu";
import { AccountMenu, type AccountMenuItem } from "@/components/account-menu";

type SessionUser = {
  nombre: string;
  email: string;
  avatarUrl: string | null;
  esEstudiante: boolean;
  esPatrocinador: boolean;
  esModerador: boolean;
  esAdmin: boolean;
};

// Enlaces públicos del menú móvil, iguales con o sin sesión.
const PUBLIC_MOBILE_ITEMS: MobileNavItem[] = [
  { href: "/proyectos", label: "Explorar" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/organizaciones", label: "Para organizaciones" },
];

/**
 * Estado de sesión del header, resuelto en el navegador (no en el servidor):
 * al sacar `getCurrentUser()` (lee cookies) del render de `SiteHeader`, las
 * páginas públicas que no necesitan sesión por su cuenta (landing, catálogo,
 * organizaciones...) dejan de forzarse a dinámicas solo por el header.
 *
 * Costo del cambio: un instante (mientras resuelve `auth.getUser()` + perfil)
 * en el que se muestra un esqueleto en vez del botón real — decisión tomada
 * con el dueño del producto.
 */
export function SiteAuthStatus() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let vigente = true;
    const supabase = createClient();

    async function cargarSesion() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        if (vigente) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("nombre, avatar_url")
          .eq("id", authUser.id)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", authUser.id),
      ]);

      if (!vigente) return;
      const rolesList = (roles ?? []).map((r) => r.role);
      setUser({
        nombre: profile?.nombre ?? authUser.email ?? "",
        email: authUser.email ?? "",
        avatarUrl: profile?.avatar_url ?? null,
        esEstudiante: rolesList.includes("estudiante"),
        esPatrocinador: rolesList.includes("patrocinador"),
        esModerador: rolesList.includes("moderador"),
        esAdmin: rolesList.includes("admin"),
      });
      setLoading(false);
    }

    cargarSesion();

    // Re-resuelve si la sesión cambia (login/logout, refresh de token) sin
    // necesidad de recargar la página.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => cargarSesion());

    return () => {
      vigente = false;
      subscription.unsubscribe();
    };
  }, []);

  // Destinos del menú de cuenta según el rol — mismo criterio que la
  // navegación de la sidebar en `app/(app)/layout.tsx`.
  const accountItems: AccountMenuItem[] = user
    ? [
        { href: "/inicio", label: "Ir a mi panel", icon: "inicio" },
        { href: "/perfil", label: "Mi perfil", icon: "perfil" },
        ...(user.esEstudiante
          ? ([{ href: "/mis-postulaciones", label: "Mis postulaciones", icon: "postulaciones" }] as AccountMenuItem[])
          : []),
        ...(user.esPatrocinador
          ? ([
              { href: "/mis-proyectos", label: "Mis proyectos", icon: "proyecto" },
              { href: "/mis-organizaciones", label: "Mis organizaciones", icon: "organizacion" },
            ] as AccountMenuItem[])
          : []),
        ...(user.esModerador || user.esAdmin
          ? ([{ href: "/moderacion", label: "Moderación", icon: "moderacion" }] as AccountMenuItem[])
          : []),
        ...(user.esAdmin
          ? ([{ href: "/admin", label: "Administración", icon: "admin" }] as AccountMenuItem[])
          : []),
      ]
    : [];

  const mobileItems: MobileNavItem[] = user
    ? [{ href: "/inicio", label: "Ir a mi panel" }, ...PUBLIC_MOBILE_ITEMS]
    : PUBLIC_MOBILE_ITEMS;

  return (
    <div className="flex items-center gap-3">
      <div className="hidden md:flex md:items-center md:gap-3">
        {loading ? (
          <div className="h-8 w-28 animate-pulse rounded-md bg-surface" aria-hidden />
        ) : user ? (
          <>
            {/* Entrada al panel privado (como "Mi Escritorio"). El cierre de
                sesión vive dentro del panel (sidebar) y en el menú móvil. */}
            <Link
              href="/inicio"
              className={buttonClasses({ variant: "primary", size: "sm" })}
            >
              Ir a mi panel
            </Link>
            <AccountMenu
              nombre={user.nombre}
              email={user.email}
              avatarUrl={user.avatarUrl}
              initials={iniciales(user.nombre)}
              items={accountItems}
            />
          </>
        ) : (
          <Link
            href="/ingresar"
            className={buttonClasses({ variant: "outline", size: "sm" })}
          >
            Iniciar sesión
          </Link>
        )}
      </div>

      <MobileMenu items={mobileItems} userName={user?.nombre ?? null} />
    </div>
  );
}

// Iniciales para el avatar: primeras letras de hasta dos palabras del nombre.
function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  const ini = partes.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return ini || "?";
}
