// Otorga el rol admin a una cuenta ya registrada, usando la service_role key
// (salta el RLS por completo). Uso único: bootstrear el primer admin de un
// ambiente donde set_user_role no sirve porque requiere ya tener un admin.
//
// Nunca corre contra la app desplegada ni queda expuesto ahí — es un script
// de un solo uso, pensado para correr manualmente desde una máquina local.
//
// Uso:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/bootstrap-admin.mjs correo@ejemplo.cl
//   (agrega --confirm al final para aplicar el cambio; sin eso solo muestra qué haría)

import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
const confirmar = process.argv.includes("--confirm");

if (!email || email.startsWith("--")) {
  console.error("Uso: node scripts/bootstrap-admin.mjs <email> [--confirm]");
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

const { data: userId, error: buscarError } = await supabase.rpc(
  "find_user_id_by_email",
  { _email: email }
);

if (buscarError) {
  console.error("Error buscando la cuenta:", buscarError.message);
  process.exit(1);
}

if (!userId) {
  console.error(`No existe ninguna cuenta registrada con el correo ${email}.`);
  process.exit(1);
}

const { data: rolesActuales, error: rolesError } = await supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", userId);

if (rolesError) {
  console.error("Error leyendo los roles actuales:", rolesError.message);
  process.exit(1);
}

console.log(`Cuenta encontrada: ${email} (${userId})`);
console.log(
  `Roles actuales: ${rolesActuales.length ? rolesActuales.map((r) => r.role).join(", ") : "(ninguno)"}`
);
console.log("Se reemplazarán por: admin");

if (!confirmar) {
  console.log("\nModo simulación (dry run) — no se aplicó ningún cambio.");
  console.log("Vuelve a correr el mismo comando agregando --confirm para aplicarlo.");
  process.exit(0);
}

// Mismo comportamiento que set_user_role (M56): reemplaza los roles, no los
// acumula — un admin bootstreado así queda como un admin normal, indistinguible
// de uno creado luego desde /admin/usuarios.
const { error: deleteError } = await supabase
  .from("user_roles")
  .delete()
  .eq("user_id", userId);

if (deleteError) {
  console.error("Error limpiando los roles anteriores:", deleteError.message);
  process.exit(1);
}

const { error: insertError } = await supabase
  .from("user_roles")
  .insert({ user_id: userId, role: "admin" });

if (insertError) {
  console.error("Error otorgando el rol admin:", insertError.message);
  process.exit(1);
}

console.log(`\nListo: ${email} ahora es admin.`);
