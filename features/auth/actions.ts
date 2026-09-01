"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPasswordValid } from "@/features/auth/password";

/**
 * Acciones de autenticación (Server Actions).
 *
 * Diseñadas para `useActionState`: reciben `(prevState, formData)` y devuelven
 * un `AuthState` con el error a mostrar en el formulario. En caso de éxito no
 * retornan: `redirect()` corta la ejecución y navega.
 */

export type AuthState = { error?: string };

// Roles que un registro puede autoasignarse (coincide con la lista blanca del
// trigger handle_new_user en M11). El trigger es la barrera real; esto es la
// validación temprana del lado del servidor para dar un mensaje claro.
const ROLES_AUTOSERVICIO = ["estudiante", "patrocinador"] as const;

// Destino tras autenticarse. Provisional hasta que exista el panel del rol.
const POST_AUTH_REDIRECT = "/inicio";

export async function signUp(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const rol = String(formData.get("rol") ?? "");

  if (!email || !password || !nombre) {
    return { error: "Completa nombre, correo y contraseña." };
  }
  if (!isPasswordValid(password)) {
    return {
      error:
        "La contraseña no cumple los requisitos: 8+ caracteres, mayúscula, minúscula y número.",
    };
  }
  if (!ROLES_AUTOSERVICIO.includes(rol as (typeof ROLES_AUTOSERVICIO)[number])) {
    return { error: "Selecciona un tipo de cuenta válido." };
  }

  const supabase = await createClient();

  // `options.data` viaja como raw_user_meta_data: el trigger de M11 lo lee para
  // crear el profile (nombre) y asignar el rol inicial.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre, rol } },
  });

  if (error) {
    return { error: traducirError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect(POST_AUTH_REDIRECT);
}

export async function signIn(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresa tu correo y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: traducirError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect(POST_AUTH_REDIRECT);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

// Traduce los mensajes de Supabase (en inglés) a un texto claro en español.
// Se mantiene acotado: cualquier otro caso muestra un mensaje genérico para no
// filtrar detalles internos.
function traducirError(mensaje: string): string {
  if (mensaje.includes("Invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (mensaje.includes("already registered")) {
    return "Ya existe una cuenta con ese correo.";
  }
  return "No se pudo completar la operación. Inténtalo de nuevo.";
}
