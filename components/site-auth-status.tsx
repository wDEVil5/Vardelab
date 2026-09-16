"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { buttonClasses } from "@/components/ui/button";
import { MobileMenu, type MobileNavItem } from "@/components/mobile-menu";
import { AccountMenu, type AccountMenuItem } from "@/components/account-menu";
import { useAuthUser } from "@/features/auth/components/auth-user-context";

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
 *
 * El usuario auth base (sin perfil/roles) viene de `AuthUserProvider`,
 * compartido con `FooterAccountLinks`; aquí solo se agrega el fetch de
 * perfil + roles que el footer no necesita.
 */
export function SiteAuthStatus() {
  const { user: authUser, loading: authLoading } = useAuthUser();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  // En móvil solo uno: avatar o hamburguesa.
  const [mobileSheet, setMobileSheet] = useState<"account" | "nav" | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!authUser) {
      queueMicrotask(() => {
        setUser(null);
        setLoading(false);
      });
      return;
    }

    let vigente = true;
    const supabase = createClient();

    async function cargarPerfil() {
      if (!authUser) return;
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

    cargarPerfil();

    return () => {
      vigente = false;
    };
  }, [authUser, authLoading]);

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

  // "Ir a mi panel" va como CTA abajo del menú (no repetido en la lista).
  const mobileItems: MobileNavItem[] = PUBLIC_MOBILE_ITEMS;

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Desktop: panel + avatar. Móvil: solo avatar (hay espacio junto al
          hamburguesa); login/registro siguen en el menú. */}
      <div className="hidden lg:flex lg:items-center lg:gap-3">
        {loading ? (
          <div className="flex items-center gap-3" aria-hidden>
            <div className="h-8 w-28 animate-pulse rounded-md bg-surface" />
            <div className="h-8 w-24 animate-pulse rounded-md bg-surface" />
          </div>
        ) : user ? (
          <>
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
          <>
            <Link
              href="/ingresar"
              className={buttonClasses({ variant: "outline", size: "sm" })}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className={buttonClasses({ variant: "primary", size: "sm" })}
            >
              Registrarse
            </Link>
          </>
        )}
      </div>

      {!loading && user ? (
        <div className="lg:hidden">
          <AccountMenu
            nombre={user.nombre}
            email={user.email}
            avatarUrl={user.avatarUrl}
            initials={iniciales(user.nombre)}
            items={accountItems}
            open={mobileSheet === "account"}
            onOpenChange={(o) => setMobileSheet(o ? "account" : null)}
          />
        </div>
      ) : null}

      <MobileMenu
        items={mobileItems}
        userName={user?.nombre ?? null}
        open={mobileSheet === "nav"}
        onOpenChange={(o) => setMobileSheet(o ? "nav" : null)}
      />
    </div>
  );
}

// Iniciales para el avatar: primeras letras de hasta dos palabras del nombre.
function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  const ini = partes.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return ini || "?";
}
