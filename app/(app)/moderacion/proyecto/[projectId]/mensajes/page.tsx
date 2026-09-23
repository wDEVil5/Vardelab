import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { getReportById } from "@/features/reports/queries";
import {
  getProjectMessages,
  getProjectParticipantNames,
} from "@/features/messages/queries";
import { logConversationOpened } from "@/features/messages/actions";
import { MessageThread } from "@/features/messages/components/message-thread";

export const metadata: Metadata = {
  title: "Conversación del proyecto · Vardelab",
};

type PageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ reportId?: string }>;
};

/**
 * Hilo de mensajes de un proyecto, en solo lectura, para un moderador que
 * investiga un reporte puntual (M99/M100). Acceso reactivo y gateado, nunca
 * navegación libre: exige un `reportId` real que apunte a este mismo
 * proyecto — sin eso, no hay forma de llegar acá. Cada visita queda
 * registrada en `audit_logs` vía `logConversationOpened`.
 */
export default async function ConversacionModeracionPage({
  params,
  searchParams,
}: PageProps) {
  const { projectId } = await params;
  const { reportId } = await searchParams;
  if (!reportId) redirect("/moderacion/reportes");

  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");

  const report = await getReportById(reportId);
  if (!report || report.target_type !== "conversacion" || report.target_id !== projectId) {
    redirect("/moderacion/reportes");
  }

  await logConversationOpened(projectId, reportId);

  const [messages, participantNames] = await Promise.all([
    getProjectMessages(projectId),
    getProjectParticipantNames(projectId),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 lg:py-10">
      <Link
        href={`/moderacion/reportes/${reportId}`}
        className="text-sm text-muted transition-colors hover:text-ink"
      >
        ← Volver al reporte
      </Link>

      <header className="mt-3 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink">Conversación del proyecto</h1>
        <p className="text-sm text-muted">
          Este acceso quedó registrado: se guardó constancia de que abriste
          este hilo desde el reporte.
        </p>
      </header>

      <div className="mt-6 rounded-2xl border border-border bg-white p-6">
        <MessageThread
          projectId={projectId}
          redirectPath={`/moderacion/proyecto/${projectId}/mensajes?reportId=${reportId}`}
          messages={messages}
          currentUserId={user.id}
          participantNames={participantNames}
          readOnly
        />
      </div>
    </div>
  );
}
