"use client";

import { useActionState } from "react";
import { sendMessage, type SendMessageState } from "@/features/messages/actions";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";
import type { ProjectMessage } from "@/features/messages/queries";

const INITIAL: SendMessageState = {};

// Fecha del mensaje en términos relativos y sin ambigüedad.
function haceCuanto(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 7) return `Hace ${dias} días`;
  const semanas = Math.floor(dias / 7);
  return semanas === 1 ? "Hace 1 sem" : `Hace ${semanas} sem`;
}

/**
 * Hilo de mensajes de un proyecto (M30, S-05): un solo hilo compartido entre
 * el patrocinador y el equipo, no conversaciones separadas por persona.
 */
export function MessageThread({
  projectId,
  redirectPath,
  messages,
}: {
  projectId: string;
  redirectPath: string;
  messages: ProjectMessage[];
}) {
  const [state, formAction] = useActionState(sendMessage, INITIAL);

  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 ? (
        <p className="text-sm text-muted">Todavía no hay mensajes.</p>
      ) : (
        <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {messages.map((m) => (
            <li
              key={m.id}
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                m.esMio ? "self-end bg-electric text-white" : "self-start bg-surface text-ink",
              )}
            >
              {!m.esMio && (
                <p className="text-xs font-semibold opacity-70">
                  {m.senderNombre ?? "Alguien"}
                </p>
              )}
              <p className="whitespace-pre-line">{m.body}</p>
              <p className={cn("mt-1 text-[10px]", m.esMio ? "text-white/70" : "text-muted")}>
                {haceCuanto(m.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="redirectPath" value={redirectPath} />
        <Textarea
          name="body"
          required
          maxLength={2000}
          placeholder="Escribe un mensaje…"
          className="min-h-20"
        />
        {state.error && (
          <p role="alert" className="text-xs text-coral">
            {state.error}
          </p>
        )}
        <SubmitButton variant="primary" size="sm" pendingText="Enviando…">
          Enviar mensaje
        </SubmitButton>
      </form>
    </div>
  );
}
