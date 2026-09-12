import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Ruta de confirmación de Supabase Auth (confirmación de registro,
 * recuperación de contraseña, y cualquier otro flujo por enlace de correo que
 * se sume después). El enlace que Supabase manda apunta acá con
 * `?code=...&next=...`; se intercambia el code por una sesión (PKCE) y se
 * redirige a `next` ya con sesión activa.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/inicio";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // El destino de error depende de qué flujo mandó al enlace: si iba a
  // actualizar la contraseña, el paso previo lógico es pedir uno nuevo desde
  // /recuperar; cualquier otro caso (confirmación de registro incluida) cae
  // en /ingresar, que es el punto de entrada común a toda la autenticación.
  const destino = next === "/actualizar-contrasena" ? "/recuperar" : "/ingresar";
  return NextResponse.redirect(
    `${origin}${destino}?error=El enlace no es válido o ya expiró.`,
  );
}
