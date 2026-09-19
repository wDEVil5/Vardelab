import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca la sesión de Supabase en cada request y propaga las cookies.
 * Si aún no hay credenciales configuradas, no hace nada (permite correr `dev`
 * antes de conectar Supabase).
 */
export async function updateSession(request: NextRequest) {
  // Ruta + query actuales, expuestas a Server Components vía `headers()` —
  // `app/(app)/layout.tsx` la necesita para armar `/ingresar?next=...` en su
  // guarda de sesión (los layouts, a diferencia de las pages, no reciben la
  // URL actual como prop). Patrón documentado de Next: clonar los headers del
  // request (no mutar `request.headers` directo) y pasarlos aparte a
  // `NextResponse.next()` — el `request` de Supabase sigue siendo el
  // original, sin tocar su manejo de cookies.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname + request.nextUrl.search);

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // No insertar lógica entre crear el cliente y refrescar la sesión.
  await supabase.auth.getUser();

  return supabaseResponse;
}
