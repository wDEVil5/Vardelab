"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
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

// milestoneId/projectId van primero en el shape para que issues[0] los
// respete antes que el resto (confirmado: los issues de `superRefine` se
// agregan DESPUÉS de los de cada campo, nunca antes). El resto de los
// chequeos (al menos un enlace/nota/archivo, formato y tamaño del archivo)
// dependen de varios campos a la vez, así que van en `superRefine` en el
// mismo orden que la cadena de `if` que reemplazan.
const AddSubmissionSchema = z
  .object({
    milestoneId: z.string().min(1, "Falta el hito."),
    projectId: z.string().min(1, "Falta el proyecto."),
    url: z.string().trim(),
    nota: z.string().trim(),
    archivo: z.union([z.instanceof(File), z.null()]),
    redirectTo: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    const tieneArchivo = data.archivo instanceof File && data.archivo.size > 0;
    if (!data.url && !data.nota && !tieneArchivo) {
      ctx.addIssue({ code: "custom", message: "Agrega al menos un enlace, un archivo o una nota." });
      return;
    }
    if (tieneArchivo && data.archivo) {
      if (!ARCHIVO_TIPOS_PERMITIDOS.includes(data.archivo.type)) {
        ctx.addIssue({ code: "custom", message: "Formato no admitido. Usa PDF, Word, imagen o ZIP." });
        return;
      }
      if (data.archivo.size > ARCHIVO_TAMANO_MAXIMO) {
        ctx.addIssue({ code: "custom", message: "El archivo no puede pesar más de 20 MB." });
      }
    }
  });

export async function addSubmission(
  _prevState: SubmissionState,
  formData: FormData,
): Promise<SubmissionState> {
  const archivoCampo = formData.get("archivo");
  const parsed = AddSubmissionSchema.safeParse({
    milestoneId: String(formData.get("milestoneId") ?? ""),
    projectId: String(formData.get("projectId") ?? ""),
    url: String(formData.get("url") ?? ""),
    nota: String(formData.get("nota") ?? ""),
    archivo: archivoCampo instanceof File ? archivoCampo : null,
    // Si viene, se navega a esta ruta tras guardar (E-06 vuelve al proyecto).
    redirectTo: String(formData.get("redirectTo") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { milestoneId, projectId, url, nota, archivo, redirectTo } = parsed.data;
  const tieneArchivo = archivo instanceof File && archivo.size > 0;

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
