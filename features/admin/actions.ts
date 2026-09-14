"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/features/auth/queries";
import { CONFIG_CAMPO_LABEL } from "@/features/admin/queries";
import type { Database } from "@/types/database.types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLES_VALIDOS: AppRole[] = [
  "estudiante",
  "patrocinador",
  "mentor",
  "moderador",
  "admin",
];

export type AdminUsersState = { error?: string };

/** Duración de baneo de GoTrue para una suspensión "indefinida" (~100 años). */
const SUSPENSION_LARGA = "876000h";

/**
 * Cambia el rol de un usuario (reemplaza todos sus roles por uno solo). El
 * modelo permite varios roles por persona (`user_roles`), pero en la práctica
 * nadie tiene más de uno hoy — se simplifica la pantalla a "un rol por
 * usuario" en vez de un editor de conjuntos, coherente con cómo se asigna el
 * rol al registrarse (M11). Deja rastro en `audit_logs` (RF-17).
 *
 * El borrado + inserción ocurre dentro de `set_user_role` (M56), una función
 * de Postgres — una sola transacción, no dos llamadas sueltas desde aquí. Así
 * un fallo a mitad de camino no deja a nadie sin rol.
 */
export async function changeUserRole(
  _prevState: AdminUsersState,
  formData: FormData,
): Promise<AdminUsersState> {
  const admin = await getCurrentUser();
  if (!admin?.esAdmin) return { error: "No autorizado." };

  const userId = String(formData.get("userId") ?? "");
  const rol = String(formData.get("rol") ?? "") as AppRole;
  if (!userId || !ROLES_VALIDOS.includes(rol)) {
    return { error: "Rol o usuario inválido." };
  }
  if (userId === admin.id && rol !== "admin") {
    return { error: "No es posible quitar el propio rol de administrador desde aquí." };
  }

  const supabase = await createClient();

  const { error: rpcError } = await supabase.rpc("set_user_role", {
    _user_id: userId,
    _role: rol,
  });
  if (rpcError) {
    console.error("[changeUserRole]", rpcError.message);
    return { error: "No se pudo actualizar el rol." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    accion: "rol_actualizado",
    entidad: "user_roles",
    entidad_id: userId,
    metadata: { rol_nuevo: rol },
  });

  revalidatePath("/admin/usuarios");
  return {};
}

/**
 * Suspende una cuenta (ban indefinido vía la Admin API de GoTrue — no hay
 * columna de estado propia, Supabase Auth ya resuelve esto). Requiere el
 * cliente `service_role`: la RLS no alcanza al esquema `auth`.
 */
export async function suspendUser(
  _prevState: AdminUsersState,
  formData: FormData,
): Promise<AdminUsersState> {
  const admin = await getCurrentUser();
  if (!admin?.esAdmin) return { error: "No autorizado." };

  const userId = String(formData.get("userId") ?? "");
  if (!userId) return { error: "Falta el usuario." };
  if (userId === admin.id) {
    return { error: "No es posible suspender la propia cuenta." };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: SUSPENSION_LARGA,
  });
  if (error) {
    console.error("[suspendUser]", error.message);
    return { error: "No se pudo suspender la cuenta." };
  }

  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    accion: "cuenta_suspendida",
    entidad: "auth.users",
    entidad_id: userId,
  });

  revalidatePath("/admin/usuarios");
  return {};
}

/** Reactiva una cuenta suspendida (`ban_duration: "none"` la desbanea). */
export async function reactivateUser(
  _prevState: AdminUsersState,
  formData: FormData,
): Promise<AdminUsersState> {
  const admin = await getCurrentUser();
  if (!admin?.esAdmin) return { error: "No autorizado." };

  const userId = String(formData.get("userId") ?? "");
  if (!userId) return { error: "Falta el usuario." };

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: "none",
  });
  if (error) {
    console.error("[reactivateUser]", error.message);
    return { error: "No se pudo reactivar la cuenta." };
  }

  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    accion: "cuenta_reactivada",
    entidad: "auth.users",
    entidad_id: userId,
  });

  revalidatePath("/admin/usuarios");
  return {};
}

export type CatalogState = { error?: string; requiereConfirmacion?: boolean };

const NOMBRE_MAX = 60;
const CATEGORIA_MAX = 40;

/** Crea una habilidad nueva en el catálogo (D-02). */
export async function createSkill(
  _prevState: CatalogState,
  formData: FormData,
): Promise<CatalogState> {
  const admin = await getCurrentUser();
  if (!admin?.esAdmin) return { error: "No autorizado." };

  const nombre = String(formData.get("nombre") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  if (!nombre || !categoria) return { error: "Nombre y categoría son obligatorios." };
  if (nombre.length > NOMBRE_MAX || categoria.length > CATEGORIA_MAX) {
    return { error: "Nombre o categoría demasiado largos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("skills")
    .insert({ nombre, categoria })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Ya existe una habilidad con ese nombre." };
    console.error("[createSkill]", error.message);
    return { error: "No se pudo crear la habilidad." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    accion: "catalogo_editado",
    entidad: "skills",
    entidad_id: data.id,
    metadata: { tipo: "creada", nombre },
  });

  revalidatePath("/admin/catalogos");
  return {};
}

/** Edita nombre y/o categoría de una habilidad existente. */
export async function updateSkill(
  _prevState: CatalogState,
  formData: FormData,
): Promise<CatalogState> {
  const admin = await getCurrentUser();
  if (!admin?.esAdmin) return { error: "No autorizado." };

  const skillId = String(formData.get("skillId") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  if (!skillId || !nombre || !categoria) {
    return { error: "Nombre y categoría son obligatorios." };
  }
  if (nombre.length > NOMBRE_MAX || categoria.length > CATEGORIA_MAX) {
    return { error: "Nombre o categoría demasiado largos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("skills")
    .update({ nombre, categoria })
    .eq("id", skillId);

  if (error) {
    if (error.code === "23505") return { error: "Ya existe una habilidad con ese nombre." };
    console.error("[updateSkill]", error.message);
    return { error: "No se pudo editar la habilidad." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    accion: "catalogo_editado",
    entidad: "skills",
    entidad_id: skillId,
    metadata: { tipo: "editada", nombre },
  });

  revalidatePath("/admin/catalogos");
  return {};
}

/**
 * Activa o desactiva una habilidad. No la borra — `profile_skills` y
 * `project_role_skills` la referencian con `on delete restrict` — así que las
 * relaciones existentes no desaparecen; una habilidad inactiva solo deja de
 * ofrecerse en formularios nuevos.
 */
export async function toggleSkillActivo(
  _prevState: CatalogState,
  formData: FormData,
): Promise<CatalogState> {
  const admin = await getCurrentUser();
  if (!admin?.esAdmin) return { error: "No autorizado." };

  const skillId = String(formData.get("skillId") ?? "");
  const nombre = String(formData.get("nombre") ?? "");
  const activo = formData.get("activo") === "true";
  if (!skillId) return { error: "Falta la habilidad." };

  const supabase = await createClient();
  const { error } = await supabase.from("skills").update({ activo }).eq("id", skillId);
  if (error) {
    console.error("[toggleSkillActivo]", error.message);
    return { error: "No se pudo cambiar el estado de la habilidad." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    accion: "catalogo_editado",
    entidad: "skills",
    entidad_id: skillId,
    metadata: { tipo: activo ? "activada" : "desactivada", nombre },
  });

  revalidatePath("/admin/catalogos");
  return {};
}

/**
 * Renombra una categoría: actualiza el texto `categoria` en todas las
 * habilidades que la usan. No es una entidad propia en el modelo (`categoria`
 * es una columna de texto en `skills`, no una tabla aparte) — renombrar es la
 * única operación que tiene sentido sobre ella; no se puede "crear" una
 * categoría vacía ni "desactivarla" como a una habilidad.
 */
export async function renameCategoria(
  _prevState: CatalogState,
  formData: FormData,
): Promise<CatalogState> {
  const admin = await getCurrentUser();
  if (!admin?.esAdmin) return { error: "No autorizado." };

  const categoriaActual = String(formData.get("categoriaActual") ?? "").trim();
  const categoriaNueva = String(formData.get("categoriaNueva") ?? "").trim();
  const confirmarFusion = formData.get("confirmarFusion") === "true";
  if (!categoriaActual || !categoriaNueva) return { error: "Falta el nombre nuevo." };
  if (categoriaNueva.length > CATEGORIA_MAX) return { error: "Nombre demasiado largo." };
  if (categoriaActual === categoriaNueva) return {};

  const supabase = await createClient();

  // Si ya existe una categoría con ese nombre (sin distinguir mayúsculas), el
  // update de abajo no la "renombra": fusiona ambas en una sola, moviendo las
  // habilidades de `categoriaActual` a la existente. Eso es válido, pero
  // silencioso — se pide una confirmación explícita antes de hacerlo.
  if (!confirmarFusion) {
    const { count } = await supabase
      .from("skills")
      .select("id", { count: "exact", head: true })
      .ilike("categoria", categoriaNueva)
      .not("categoria", "eq", categoriaActual);
    if (count && count > 0) {
      return {
        error: `Ya existe la categoría "${categoriaNueva}". Confirma para combinarla con "${categoriaActual}".`,
        requiereConfirmacion: true,
      };
    }
  }

  const { error } = await supabase
    .from("skills")
    .update({ categoria: categoriaNueva })
    .eq("categoria", categoriaActual);

  if (error) {
    console.error("[renameCategoria]", error.message);
    return { error: "No se pudo renombrar la categoría." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    accion: "catalogo_editado",
    entidad: "skills",
    metadata: { tipo: "categoria_renombrada", categoria_de: categoriaActual, categoria_a: categoriaNueva },
  });

  revalidatePath("/admin/catalogos");
  return {};
}

export type PilotConfigState = { error?: string };

/**
 * Guarda la configuración del piloto (D-05, deseable). Solo compara y
 * persiste los campos que en verdad cambiaron — el metadata de auditoría
 * lista nombres de campo, no el objeto completo, para no duplicar en cada
 * evento algo que ya se puede ver en la propia pantalla de configuración.
 *
 * `moderacion_previa_obligatoria`, `autoaprobacion_proyectos`,
 * `patrocinadores_externos` y `registro_abierto` además cambian
 * comportamiento real (ver M24): el trigger de estados de `projects`, la
 * policy de creación de organizaciones y `signUp()` los leen directo de la
 * tabla. El resto de los campos (notificaciones) hoy solo quedan guardados.
 */
export async function updatePilotConfig(
  _prevState: PilotConfigState,
  formData: FormData,
): Promise<PilotConfigState> {
  const admin = await getCurrentUser();
  if (!admin?.esAdmin) return { error: "No autorizado." };

  const boolField = (campo: string) => formData.get(campo) === "true";

  const nuevo = {
    registro_abierto: boolField("registroAbierto"),
    moderacion_previa_obligatoria: boolField("moderacionPreviaObligatoria"),
    patrocinadores_externos: boolField("patrocinadoresExternos"),
    autoaprobacion_proyectos: boolField("autoaprobacionProyectos"),
    notif_postulacion_recibida: boolField("notifPostulacionRecibida"),
    notif_hito_proximo_vencer: boolField("notifHitoProximoVencer"),
    notif_respuesta_moderacion: boolField("notifRespuestaModeracion"),
    notif_resumen_semanal: boolField("notifResumenSemanal"),
  };

  const supabase = await createClient();
  const { data: actual, error: lecturaError } = await supabase
    .from("pilot_config")
    .select("*")
    .eq("id", true)
    .single();
  if (lecturaError || !actual) {
    console.error("[updatePilotConfig:lectura]", lecturaError?.message);
    return { error: "No se pudo leer la configuración actual." };
  }

  const camposCambiados = (Object.keys(nuevo) as (keyof typeof nuevo)[]).filter(
    (campo) => actual[campo] !== nuevo[campo],
  );
  if (camposCambiados.length === 0) return {};

  const { error } = await supabase
    .from("pilot_config")
    .update({ ...nuevo, updated_by: admin.id })
    .eq("id", true);
  if (error) {
    console.error("[updatePilotConfig]", error.message);
    return { error: "No se pudo guardar la configuración." };
  }

  const etiquetas = [
    ...new Set(camposCambiados.map((campo) => CONFIG_CAMPO_LABEL[campo] ?? campo)),
  ];
  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    accion: "configuracion_actualizada",
    entidad: "pilot_config",
    metadata: { campos: etiquetas },
  });

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/auditoria");
  return {};
}

export type OrgVerificationState = { error?: string };

/**
 * Aprueba la verificación de una organización (`en_revision → verificado`).
 * El trigger `organizations_guard_verificacion` (M62) es la barrera real de
 * quién puede — acá solo se filtra en la propia query para dar un mensaje
 * claro si ya no aplica. Deja rastro en `audit_logs`, mismo criterio que
 * cambiar un rol o suspender una cuenta: es una decisión de confianza sobre
 * la cuenta de alguien más, no una acción propia.
 */
export async function approveOrgVerification(
  _prevState: OrgVerificationState,
  formData: FormData,
): Promise<OrgVerificationState> {
  const admin = await getCurrentUser();
  if (!admin?.esAdmin) return { error: "No autorizado." };

  const orgId = String(formData.get("orgId") ?? "");
  if (!orgId) return { error: "Falta la organización." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .update({ verificacion: "verificado" })
    .eq("id", orgId)
    .eq("verificacion", "en_revision")
    .select("id, nombre");

  if (error) {
    console.error("[approveOrgVerification]", error.message);
    return { error: "No se pudo aprobar la verificación." };
  }
  if (!data || data.length === 0) {
    return { error: "No se pudo aprobar (¿ya no está en revisión?)." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    accion: "organizacion_verificada",
    entidad: "organizations",
    entidad_id: orgId,
    metadata: { nombre: data[0].nombre },
  });

  revalidatePath(`/admin/organizaciones/${orgId}`);
  revalidatePath("/admin/organizaciones");
  revalidatePath("/organizaciones");
  return {};
}

/** Rechaza la verificación de una organización (`en_revision → sin_verificar`). */
export async function rejectOrgVerification(
  _prevState: OrgVerificationState,
  formData: FormData,
): Promise<OrgVerificationState> {
  const admin = await getCurrentUser();
  if (!admin?.esAdmin) return { error: "No autorizado." };

  const orgId = String(formData.get("orgId") ?? "");
  if (!orgId) return { error: "Falta la organización." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .update({ verificacion: "sin_verificar" })
    .eq("id", orgId)
    .eq("verificacion", "en_revision")
    .select("id, nombre");

  if (error) {
    console.error("[rejectOrgVerification]", error.message);
    return { error: "No se pudo rechazar la verificación." };
  }
  if (!data || data.length === 0) {
    return { error: "No se pudo rechazar (¿ya no está en revisión?)." };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    accion: "organizacion_rechazada",
    entidad: "organizations",
    entidad_id: orgId,
    metadata: { nombre: data[0].nombre },
  });

  revalidatePath(`/admin/organizaciones/${orgId}`);
  revalidatePath("/admin/organizaciones");
  return {};
}
