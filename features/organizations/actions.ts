"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, requireUser } from "@/features/auth/queries";
import { getMyOrganization } from "@/features/organizations/queries";
import { INVITACIONES_HABILITADAS } from "@/features/organizations/config";
import { sendEmail, sendEmailToUser } from "@/features/notifications/email";

/**
 * Acciones de organizaciones (lado del patrocinador).
 *
 * `createOrganization` crea una organización propiedad del usuario. La RLS
 * `organizations_insert_own` (M3/M73) exige `owner_id = auth.uid()` y el rol
 * 'patrocinador' (o admin), sea cual sea el `tipo` elegido; la organización
 * nace `sin_verificar` (default de la tabla) — la verificación la hará el
 * moderador/admin en una etapa futura. El chequeo de rol se adelanta acá para
 * no depender del mensaje genérico que da un rechazo de RLS.
 */

export type CreateOrgState = { error?: string };

// Tipos de organización (enum org_type de M0).
const TIPOS = [
  "academica",
  "social",
  "emprendimiento",
  "empresa",
  "interna",
] as const;

export async function createOrganization(
  _prevState: CreateOrgState,
  formData: FormData,
): Promise<CreateOrgState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "");
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const sitioWeb = String(formData.get("sitio_web") ?? "").trim();
  const contacto = String(formData.get("contacto") ?? "").trim();
  const contactoEmail = String(formData.get("contacto_email") ?? "").trim();

  if (!nombre) return { error: "La organización necesita un nombre." };
  if (!TIPOS.includes(tipo as (typeof TIPOS)[number])) {
    return { error: "Selecciona un tipo de organización válido." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/ingresar");
  if (!currentUser.esPatrocinador) {
    return {
      error:
        "Solo cuentas de patrocinador pueden crear una organización. Tu cuenta no tiene ese rol.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("organizations").insert({
    owner_id: currentUser.id,
    nombre,
    tipo: tipo as (typeof TIPOS)[number],
    descripcion: descripcion || null,
    sitio_web: sitioWeb || null,
    contacto: contacto || null,
    contacto_email: contactoEmail || null,
  });

  if (error) {
    console.error("[createOrganization]", error.message);
    return { error: "No se pudo crear la organización. Inténtalo de nuevo." };
  }

  revalidatePath("/mis-organizaciones");
  revalidatePath("/organizaciones");
  redirect("/mis-organizaciones?creada=1");
}

export type EditOrgState = { error?: string };

/**
 * Edita una organización propia. No toca `verificacion` (eso es del moderador).
 * La RLS `organizations_update_own` (M3) exige `owner_id = auth.uid()`, y aquí
 * se filtra el update por `id` para acotarlo a la organización indicada.
 */
export async function updateOrganization(
  _prevState: EditOrgState,
  formData: FormData,
): Promise<EditOrgState> {
  const id = String(formData.get("orgId") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "");
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const sitioWeb = String(formData.get("sitio_web") ?? "").trim();
  const contacto = String(formData.get("contacto") ?? "").trim();
  const contactoEmail = String(formData.get("contacto_email") ?? "").trim();

  if (!id) return { error: "Falta la organización." };
  if (!nombre) return { error: "La organización necesita un nombre." };
  if (!TIPOS.includes(tipo as (typeof TIPOS)[number])) {
    return { error: "Selecciona un tipo de organización válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      nombre,
      tipo: tipo as (typeof TIPOS)[number],
      descripcion: descripcion || null,
      sitio_web: sitioWeb || null,
      contacto: contacto || null,
      contacto_email: contactoEmail || null,
    })
    .eq("id", id);

  if (error) {
    console.error("[updateOrganization]", error.message);
    return { error: "No se pudieron guardar los cambios. Inténtalo de nuevo." };
  }

  revalidatePath("/mis-organizaciones");
  revalidatePath("/organizaciones");
  revalidatePath(`/mis-organizaciones/${id}/editar`);
  redirect(`/mis-organizaciones/${id}/editar?guardado=1`);
}

/**
 * Solicita la verificación de una organización propia (`sin_verificar →
 * en_revision`). El trigger `organizations_guard_verificacion` (M62) es la
 * barrera real de quién puede y desde qué estado — acá solo se da feedback
 * si la query no afecta filas (¿ya no está sin_verificar?). No genera
 * notificación (igual que enviar un proyecto a revisión no le avisa al
 * moderador): el admin la ve en la cola de `/admin/organizaciones`.
 */
export async function requestOrgVerification(formData: FormData): Promise<void> {
  const id = String(formData.get("orgId") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ verificacion: "en_revision" })
    .eq("id", id)
    .eq("verificacion", "sin_verificar");

  if (error) {
    console.error("[requestOrgVerification]", error.message);
  }

  revalidatePath(`/mis-organizaciones/${id}/editar`);
  revalidatePath("/mis-organizaciones");
}

/** Retracta una solicitud de verificación propia (`en_revision → sin_verificar`). */
export async function withdrawOrgVerificationRequest(formData: FormData): Promise<void> {
  const id = String(formData.get("orgId") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ verificacion: "sin_verificar" })
    .eq("id", id)
    .eq("verificacion", "en_revision");

  if (error) {
    console.error("[withdrawOrgVerificationRequest]", error.message);
  }

  revalidatePath(`/mis-organizaciones/${id}/editar`);
  revalidatePath("/mis-organizaciones");
}

export type DeleteOrgState = { error?: string };

/**
 * Elimina una organización propia. Regla de seguridad (por la cascada: borrar
 * una organización arrastra TODOS sus proyectos y, con ellos, roles,
 * postulaciones, equipos, hitos y evaluaciones): solo se permite si la
 * organización no tiene proyectos. La RLS `organizations_delete_own` (M3) ya
 * restringe al dueño; esta guarda agrega la protección de negocio.
 */
export async function deleteOrganization(
  _prevState: DeleteOrgState,
  formData: FormData,
): Promise<DeleteOrgState> {
  const id = String(formData.get("orgId") ?? "");
  if (!id) return { error: "Falta la organización." };

  // Solo el dueño, y se verifica ANTES de tocar datos scoped por el `orgId` del
  // formulario: la RLS de `projects` deja ver los publicados de cualquier
  // organización, así que el conteo de abajo no puede correr para un id ajeno.
  const user = await getCurrentUser();
  const org = user ? await getMyOrganization(id) : null;
  if (!user || org?.owner_id !== user.id) {
    return { error: "Solo el dueño puede eliminar esta organización." };
  }

  const supabase = await createClient();

  // No debe tener proyectos.
  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("org_id", id);

  if (count && count > 0) {
    return {
      error:
        "No puedes eliminar una organización con proyectos. Elimina o mueve sus proyectos primero.",
    };
  }

  const { error } = await supabase.from("organizations").delete().eq("id", id);
  if (error) {
    console.error("[deleteOrganization]", error.message);
    return { error: "No se pudo eliminar la organización. Inténtalo de nuevo." };
  }

  revalidatePath("/mis-organizaciones");
  revalidatePath("/organizaciones");
  redirect("/mis-organizaciones?eliminada=1");
}

export type OrgLogoState = { error?: string };

const LOGO_TIPOS_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"];
const LOGO_TAMANO_MAXIMO = 2 * 1024 * 1024; // 2 MB, igual que el bucket (M35).

/**
 * Sube el logo de una organización propia (S-01). Mismo patrón que
 * `uploadAvatar` (M25): un objeto por organización en el bucket `org-logos`,
 * nombrado con su propio id — la política de Storage (`org_logos_insert_own`,
 * M35) es la que realmente impide subir el logo de una organización ajena.
 */
export async function uploadOrgLogo(
  _prevState: OrgLogoState,
  formData: FormData,
): Promise<OrgLogoState> {
  const orgId = String(formData.get("orgId") ?? "");
  const file = formData.get("logo");

  if (!orgId) return { error: "Falta la organización." };
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona una imagen." };
  }
  if (!LOGO_TIPOS_PERMITIDOS.includes(file.type)) {
    return { error: "Formato no admitido. Usa PNG, JPG o WEBP." };
  }
  if (file.size > LOGO_TAMANO_MAXIMO) {
    return { error: "La imagen no puede pesar más de 2 MB." };
  }

  const supabase = await createClient();
  await requireUser(supabase);

  const { error: uploadError } = await supabase.storage
    .from("org-logos")
    .upload(orgId, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    console.error("[uploadOrgLogo]", uploadError.message);
    return { error: "No se pudo subir el logo. Inténtalo de nuevo." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("org-logos").getPublicUrl(orgId);

  const { error } = await supabase
    .from("organizations")
    .update({ logo_url: `${publicUrl}?v=${Date.now()}` })
    .eq("id", orgId);

  if (error) {
    console.error("[uploadOrgLogo]", error.message);
    return { error: "No se pudo guardar el logo." };
  }

  revalidatePath(`/mis-organizaciones/${orgId}/editar`);
  revalidatePath("/mis-organizaciones");
  revalidatePath("/organizaciones");
  return {};
}

export type InviteMemberState = { error?: string; ok?: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Invita a alguien a una organización por correo (M37/M38). Si el correo ya
 * es de un usuario registrado, la membresía queda 'activa' de una — con
 * acceso real a los proyectos de la organización, mismo nivel que el dueño
 * (M38); si no, 'pendiente' hasta que se registre con ese correo
 * (`handle_new_user` la activa en ese momento).
 */
export async function inviteOrganizationMember(
  _prevState: InviteMemberState,
  formData: FormData,
): Promise<InviteMemberState> {
  if (!INVITACIONES_HABILITADAS) {
    return { error: "Esta función todavía no está disponible." };
  }

  const orgId = String(formData.get("orgId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!orgId) return { error: "Falta la organización." };
  if (!EMAIL_RE.test(email)) return { error: "Ingresa un correo válido." };

  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { data: userId, error: lookupError } = await supabase.rpc(
    "find_user_id_by_email",
    { _email: email },
  );
  if (lookupError) {
    console.error("[inviteOrganizationMember]", lookupError.message);
    return { error: "No se pudo procesar la invitación. Inténtalo de nuevo." };
  }

  const { error } = await supabase.from("organization_members").insert({
    org_id: orgId,
    invited_email: email,
    user_id: userId ?? null,
    status: "pendiente",
    invited_by: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ese correo ya está invitado a esta organización." };
    }
    console.error("[inviteOrganizationMember]", error.message);
    return { error: "No se pudo enviar la invitación. Inténtalo de nuevo." };
  }

  // Correo a la dirección tal cual se escribió en el formulario (M43): sirve
  // para los dos casos (ya tiene cuenta o no), a diferencia de
  // `sendEmailToUser` que necesita un `user_id` que acá puede no existir
  // todavía. La invitación queda pendiente hasta que la persona la acepte
  // desde /mis-invitaciones (M110); si no tiene cuenta, el link manda a
  // /registro y la verá al registrarse con este mismo correo.
  const { data: org } = await supabase
    .from("organizations")
    .select("nombre")
    .eq("id", orgId)
    .maybeSingle();
  after(() =>
    sendEmail(
      email,
      "invitacion_organizacion",
      `Te invitaron a co-gestionar "${org?.nombre ?? "una organización"}" en Vardelab.`,
      userId ? "/mis-invitaciones" : "/registro",
    ),
  );

  revalidatePath(`/mis-organizaciones/${orgId}/miembros`);
  return { ok: true };
}

/**
 * Saca a alguien de una organización (o revoca una invitación pendiente). La
 * RLS `organization_members_delete` deja hacerlo al dueño, a cualquier
 * miembro activo (mismos permisos), o al propio invitado.
 */
export type RemoveMemberState = { error?: string };

export async function removeOrganizationMember(
  _prevState: RemoveMemberState,
  formData: FormData,
): Promise<RemoveMemberState> {
  const memberId = String(formData.get("memberId") ?? "");
  const orgId = String(formData.get("orgId") ?? "");
  if (!memberId || !orgId) return { error: "Falta el integrante." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    console.error("[removeOrganizationMember]", error.message);
    return { error: "No se pudo quitar al integrante. Inténtalo de nuevo." };
  }

  revalidatePath(`/mis-organizaciones/${orgId}/miembros`);
  return {};
}

/**
 * Traduce los motivos de rechazo de `transfer_organization_ownership` a un
 * mensaje que tenga sentido para quien lo ve. Cualquier otro error se trata
 * como fallo genérico, sin exponer detalles internos.
 */
function mensajeTransferencia(motivo: string): string {
  if (motivo.includes("suspendida")) {
    return "La cuenta de esa persona está suspendida y no puede recibir la propiedad.";
  }
  if (motivo.includes("miembro activo")) {
    return "Esa persona ya no es miembro activo de la organización.";
  }
  if (motivo.includes("No autorizado")) {
    return "No tienes permiso para transferir esta organización.";
  }
  return "No se pudo transferir la propiedad. Inténtalo de nuevo.";
}

export type TransferOwnershipState = { error?: string; ok?: boolean };

/**
 * Transfiere la propiedad a un miembro activo (M106). La función SQL reautoriza
 * al dueño y hace el cambio junto con la notificación in-app y la auditoría; el
 * correo sale después de responder, como el resto de avisos por correo.
 */
export async function transferOrganizationOwnership(
  _prevState: TransferOwnershipState,
  formData: FormData,
): Promise<TransferOwnershipState> {
  const orgId = String(formData.get("orgId") ?? "");
  const newOwnerId = String(formData.get("newOwnerId") ?? "");
  if (!orgId || !newOwnerId) return { error: "Falta la organización o la persona." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("transfer_organization_ownership", {
    _org_id: orgId,
    _new_owner_id: newOwnerId,
  });

  if (error) {
    console.error("[transferOrganizationOwnership]", error.message);
    return { error: mensajeTransferencia(error.message) };
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("nombre")
    .eq("id", orgId)
    .maybeSingle();
  after(() =>
    sendEmailToUser(
      newOwnerId,
      "organizacion_propiedad_transferida",
      `Ahora eres el dueño de "${org?.nombre ?? "una organización"}" en Vardelab.`,
      `/mis-organizaciones/${orgId}/editar`,
    ),
  );

  revalidatePath(`/mis-organizaciones/${orgId}/miembros`);
  revalidatePath(`/mis-organizaciones/${orgId}/editar`);
  revalidatePath("/mis-organizaciones");
  return { ok: true };
}

export type InvitationResponseState = { error?: string; ok?: boolean };

/**
 * Acepta una invitación a co-gestionar la organización (M110). Solo la puede
 * aceptar quien fue invitado: la función SQL lo verifica con `auth.uid()`.
 */
export async function acceptOrganizationInvitation(
  _prevState: InvitationResponseState,
  formData: FormData,
): Promise<InvitationResponseState> {
  const memberId = String(formData.get("memberId") ?? "");
  if (!memberId) return { error: "Falta la invitación." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_organization_invitation", {
    _member_id: memberId,
  });

  if (error || !data) {
    if (error) console.error("[acceptOrganizationInvitation]", error.message);
    return { error: "No se pudo aceptar la invitación. Puede que ya no esté disponible." };
  }

  revalidatePath("/mis-invitaciones");
  revalidatePath("/mis-organizaciones");
  return { ok: true };
}

/**
 * Rechaza una invitación borrando la fila del propio invitado; la policy de
 * delete de `organization_members` ya permite a quien es invitado hacerlo.
 */
export async function declineOrganizationInvitation(
  _prevState: InvitationResponseState,
  formData: FormData,
): Promise<InvitationResponseState> {
  const memberId = String(formData.get("memberId") ?? "");
  if (!memberId) return { error: "Falta la invitación." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", memberId)
    .eq("status", "pendiente");

  if (error) {
    console.error("[declineOrganizationInvitation]", error.message);
    return { error: "No se pudo rechazar la invitación. Inténtalo de nuevo." };
  }

  revalidatePath("/mis-invitaciones");
  return { ok: true };
}
