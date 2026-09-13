"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPasswordValid } from "@/features/auth/password";
import { SITE_URL } from "@/lib/site";

/**
 * Acciones de autenticación (Server Actions).
 *
 * Diseñadas para `useActionState`: reciben `(prevState, formData)` y devuelven
 * un `AuthState` con el error a mostrar en el formulario. En caso de éxito no
 * retornan: `redirect()` corta la ejecución y navega.
 */

export type AuthState = { error?: string };
export type SignUpState = { error?: string; ok?: boolean };

// Roles que un registro puede autoasignarse (coincide con la lista blanca del
// trigger handle_new_user en M11). El trigger es la barrera real; esto es la
// validación temprana del lado del servidor para dar un mensaje claro.
const ROLES_AUTOSERVICIO = ["estudiante", "patrocinador"] as const;

// Destino tras autenticarse. Provisional hasta que exista el panel del rol.
const POST_AUTH_REDIRECT = "/inicio";

export async function signUp(
  _prevState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
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

  // "Registro abierto/cerrado" (D-05): el admin puede pausar altas nuevas sin
  // tocar código. Se consulta vía RPC (no hay sesión todavía en el registro,
  // así que la RLS de `pilot_config` no alcanza) a una función `security
  // definer` (M24) que sí puede leerla.
  const { data: registroAbierto, error: configError } = await supabase.rpc(
    "pilot_registro_abierto",
  );
  if (configError) {
    console.error("[signUp:pilot_registro_abierto]", configError.message);
  } else if (registroAbierto === false) {
    return { error: "El registro de nuevas cuentas está pausado por el momento." };
  }

  // `options.data` viaja como raw_user_meta_data: el trigger de M11 lo lee para
  // crear el profile (nombre) y asignar el rol inicial. `emailRedirectTo` manda
  // el enlace de confirmación por la misma ruta `/auth/confirm` que ya usa la
  // recuperación de contraseña.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre, rol },
      emailRedirectTo: `${SITE_URL}/auth/confirm?next=${POST_AUTH_REDIRECT}`,
    },
  });

  if (error) {
    return { error: traducirError(error.message) };
  }

  // Con confirmaciones activas, `signUp` no deja sesión iniciada: hay que
  // avisar que revise su correo, no redirigir como si ya hubiera entrado.
  return { ok: true };
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

export type ResetRequestState = { error?: string; ok?: boolean };

/**
 * Pide el enlace de recuperación de contraseña. Siempre responde `ok` (exista
 * o no una cuenta con ese correo): Supabase ya se comporta así para no dejar
 * enumerar correos registrados, y el mensaje en pantalla es el mismo en
 * ambos casos.
 */
export async function requestPasswordReset(
  _prevState: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Ingresa tu correo." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/confirm?next=/actualizar-contrasena`,
  });

  // Solo se informa un error real de Supabase (p. ej. límite de envíos); que
  // el correo no exista no cuenta como error de cara al usuario.
  if (error && !error.message.includes("rate limit")) {
    console.error("[requestPasswordReset]", error.message);
  }

  return { ok: true };
}

export type UpdatePasswordState = { error?: string };

/**
 * Define la nueva contraseña. Requiere la sesión que dejó `exchangeCodeForSession`
 * en `/auth/confirm` al abrir el enlace del correo — sin eso, no hay a quién
 * actualizarle la contraseña.
 */
export async function updatePassword(
  _prevState: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") ?? "");

  if (!isPasswordValid(password)) {
    return {
      error:
        "La contraseña no cumple los requisitos: 8+ caracteres, mayúscula, minúscula y número.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "El enlace expiró o ya se usó. Solicita uno nuevo desde \"Ingresar\".",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("[updatePassword]", error.message);
    return { error: "No se pudo actualizar la contraseña. Inténtalo de nuevo." };
  }

  revalidatePath("/", "layout");
  redirect(POST_AUTH_REDIRECT);
}

/**
 * Cambia la contraseña desde `/perfil`, con sesión ya activa (a diferencia de
 * `updatePassword`, pensada para el enlace de recuperación) — se queda en la
 * misma página en vez de saltar a la pantalla de auth de pantalla completa.
 */
export async function changePassword(
  _prevState: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword) {
    return { error: "Ingresa tu contraseña actual." };
  }
  if (!isPasswordValid(password)) {
    return {
      error:
        "La contraseña no cumple los requisitos: 8+ caracteres, mayúscula, minúscula y número.",
    };
  }
  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar?next=/perfil");
  if (!user.email) {
    return { error: "No se pudo verificar tu cuenta. Inténtalo de nuevo." };
  }

  // Re-autentica con la contraseña actual antes de cambiarla: la sesión ya
  // está activa, pero eso no basta para una acción sensible como esta (ej.
  // alguien que use el equipo desatendido no debería poder cambiarla sin
  // saber la actual).
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (authError) {
    return { error: "La contraseña actual no es correcta." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    console.error("[changePassword]", updateError.message);
    return { error: "No se pudo actualizar la contraseña. Inténtalo de nuevo." };
  }

  revalidatePath("/perfil");
  redirect("/perfil?guardado=contrasena");
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
  if (mensaje.includes("Email not confirmed")) {
    return "Confirma tu correo antes de ingresar. Revisa el enlace que te enviamos.";
  }
  return "No se pudo completar la operación. Inténtalo de nuevo.";
}
