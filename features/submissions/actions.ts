"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/features/auth/queries";

/**
 * Acciones de entregas (lado del estudiante/equipo). La RLS
 * `submissions_insert_member` (M5) exige ser integrante del equipo del proyecto
 * del hito. El modelo es "enlace + nota + archivo opcional" (M48): la URL sigue
 * siendo lo correcto para un repo, un deploy o un Figma; el archivo es para lo
 * que no vive en ningún lado más (un PDF, una imagen, un documento).
 */

export type SubmissionState = { error?: string };

// Mismos tipos y tamaño que el bucket `submission-files` (M48) — se valida acá
// primero para dar un mensaje claro; el límite real que no se puede saltar es
// el del bucket.
const ARCHIVO_TIPOS_PERMITIDOS = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ARCHIVO_TAMANO_MAXIMO = 20 * 1024 * 1024; // 20 MB

export async function addSubmission(
  _prevState: SubmissionState,
  formData: FormData,
): Promise<SubmissionState> {
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  const nota = String(formData.get("nota") ?? "").trim();
  const archivo = formData.get("archivo");
  const tieneArchivo = archivo instanceof File && archivo.size > 0;
  // Si viene, se navega a esta ruta tras guardar (E-06 vuelve al proyecto).
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();

  if (!milestoneId) return { error: "Falta el hito." };
  if (!projectId) return { error: "Falta el proyecto." };
  if (!url && !nota && !tieneArchivo) {
    return { error: "Agrega al menos un enlace, un archivo o una nota." };
  }
  if (tieneArchivo) {
    if (!ARCHIVO_TIPOS_PERMITIDOS.includes(archivo.type)) {
      return { error: "Formato no admitido. Usa PDF, Word, imagen o ZIP." };
    }
    if (archivo.size > ARCHIVO_TAMANO_MAXIMO) {
      return { error: "El archivo no puede pesar más de 20 MB." };
    }
  }

  const supabase = await createClient();
  const user = await requireUser(supabase);

  // Ruta `${proyecto}/${hito}/...`: la política de Storage (M48) deriva el
  // proyecto del primer segmento para decidir quién puede subir/ver/borrar,
  // sin necesitar un join contra `submissions` (que todavía no existe en el
  // insert). El nombre lleva la hora para no pisar un archivo con el mismo
  // nombre subido antes. Se sanea el nombre original: no debe poder inyectar
  // segmentos de ruta (`/`, `..`) hacia otro hito dentro del mismo proyecto.
  let archivoUrl: string | null = null;
  if (tieneArchivo) {
    const nombreSeguro = archivo.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
    const ruta = `${projectId}/${milestoneId}/${Date.now()}-${nombreSeguro}`;
    const { error: uploadError } = await supabase.storage
      .from("submission-files")
      .upload(ruta, archivo, { contentType: archivo.type });
    if (uploadError) {
      console.error("[addSubmission:upload]", uploadError.message);
      return { error: "No se pudo subir el archivo. Inténtalo de nuevo." };
    }
    archivoUrl = ruta;
  }

  const { error } = await supabase.from("submissions").insert({
    milestone_id: milestoneId,
    submitted_by: user.id,
    url: url || null,
    nota: nota || null,
    archivo_url: archivoUrl,
  });

  if (error) {
    console.error("[addSubmission]", error.message);
    // El archivo ya se subió a Storage antes de este insert (ver comentario
    // arriba); si la fila no se pudo crear, hay que borrarlo — si no, queda
    // huérfano, ocupando espacio sin que ninguna entrega lo referencie.
    if (archivoUrl) {
      const { error: cleanupError } = await supabase.storage
        .from("submission-files")
        .remove([archivoUrl]);
      if (cleanupError) console.error("[addSubmission:cleanup]", cleanupError.message);
    }
    return { error: "No se pudo registrar la entrega. Inténtalo de nuevo." };
  }

  // La entrega se ve desde el espacio del proyecto del estudiante y la del gestor.
  revalidatePath(`/mis-proyectos/${projectId}`);
  revalidatePath("/proyecto");

  // Si el formulario pidió volver a una ruta (E-06), se navega ahí.
  if (redirectTo) redirect(redirectTo);
  return {};
}

/**
 * Elimina una entrega propia (o el gestor), y su archivo en Storage si tenía
 * uno — sin esto quedaría huérfano, ocupando espacio sin que nada lo referencie.
 * RLS `submissions_delete_author_or_manager` (fila) y
 * `submission_files_delete_member_or_manager` (Storage, M48).
 */
export type DeleteSubmissionState = { error?: string };

export async function deleteSubmission(
  _prevState: DeleteSubmissionState,
  formData: FormData,
): Promise<DeleteSubmissionState> {
  const submissionId = String(formData.get("submissionId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!submissionId) return { error: "Falta la entrega." };

  const supabase = await createClient();

  const { data: entrega } = await supabase
    .from("submissions")
    .select("archivo_url")
    .eq("id", submissionId)
    .maybeSingle();

  const { error } = await supabase
    .from("submissions")
    .delete()
    .eq("id", submissionId);

  if (error) {
    console.error("[deleteSubmission]", error.message);
    return { error: "No se pudo eliminar la entrega. Inténtalo de nuevo." };
  }

  if (entrega?.archivo_url) {
    const { error: removeError } = await supabase.storage
      .from("submission-files")
      .remove([entrega.archivo_url]);
    if (removeError) console.error("[deleteSubmission:archivo]", removeError.message);
  }

  revalidatePath(`/mis-proyectos/${projectId}`);
  revalidatePath("/mis-postulaciones");
  return {};
}
