"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, type SendMessageState } from "@/features/messages/actions";
import { cn } from "@/lib/utils";
import type { ProjectMessage } from "@/features/messages/queries";

const INITIAL: SendMessageState = {};

/** Ícono de avión de papel, para el botón de enviar. */
function IconEnviar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

/**
 * Botón de enviar compacto (ícono, no texto), dentro del propio campo de
 * mensaje — inspirado en el chat de tareas de Microsoft Planner: un botón
 * grande de "Enviar mensaje" debajo ocupaba más espacio del que este hilo,
 * pensado para caber en una tarjeta lateral, tenía disponible.
 */
function BotonEnviar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Enviar mensaje"
      title="Enviar mensaje"
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-electric text-white transition-colors hover:bg-electric/90 disabled:opacity-50"
    >
      {pending ? (
        <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
        </svg>
      ) : (
        <IconEnviar className="size-4" />
      )}
    </button>
  );
}

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
 * Hilo de mensajes de un proyecto (M30, S-05), en vivo (M49): un solo hilo
 * compartido entre el patrocinador y el equipo, no conversaciones separadas
 * por persona. `messages` es la carga inicial (del servidor); a partir de ahí,
 * una suscripción de Supabase Realtime agrega los mensajes nuevos del otro
 * lado sin necesidad de recargar la página.
 */
export function MessageThread({
  projectId,
  redirectPath,
  messages,
  currentUserId,
  participantNames,
  variant = "compact",
}: {
  projectId: string;
  redirectPath: string;
  messages: ProjectMessage[];
  currentUserId: string;
  participantNames: Record<string, string>;
  /**
   * "compact" (por defecto): la lista de mensajes tiene una altura tope fija
   * (`max-h-72`), pensada para compartir tarjeta con otro contenido. "fill":
   * el hilo ocupa toda la altura que le dé su contenedor (necesita venir
   * dentro de un `flex flex-col` con una altura real, como una columna que se
   * estira al alto de la fila del grid) — la lista de mensajes crece y hace
   * scroll interno, y el campo de escribir queda siempre anclado abajo.
   */
  variant?: "compact" | "fill";
}) {
  const [state, formAction] = useActionState(sendMessage, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const enviado = useRef(false);
  const listaRef = useRef<HTMLUListElement>(null);

  // Mensajes recibidos en vivo que todavía no llegaron por props (el servidor
  // los incluirá recién en el próximo revalidatePath de esta ruta) — se
  // combinan con `messages` para no perder ninguno mientras tanto.
  const [enVivo, setEnVivo] = useState<ProjectMessage[]>([]);

  // Cuando el servidor manda una lista nueva (por ejemplo, tras enviar un
  // mensaje propio), ya no hace falta guardar aparte lo que ahí ya viene.
  useEffect(() => {
    setEnVivo((prev) => prev.filter((m) => !messages.some((sv) => sv.id === m.id)));
  }, [messages]);

  const todos = useMemo(() => {
    const combinados = [...messages, ...enVivo];
    combinados.sort((a, b) => a.created_at.localeCompare(b.created_at));
    return combinados;
  }, [messages, enVivo]);

  // La lista más reciente vive en un ref porque el callback de la suscripción
  // se registra una sola vez (no se quiere reabrir el canal en cada mensaje).
  const todosRef = useRef(todos);
  todosRef.current = todos;

  useEffect(() => {
    const supabase = createClient();
    let canal: ReturnType<typeof supabase.channel> | null = null;
    let cancelado = false;

    // La conexión de Realtime se autentica sola con la clave anónima; para que
    // las políticas RLS de `project_messages` (que dependen de `auth.uid()`)
    // dejen pasar los mensajes de este proyecto, hay que pasarle el token de
    // la sesión actual explícitamente antes de suscribirse — si no, el canal
    // se "suscribe" sin error pero nunca llega ningún INSERT (RLS los filtra
    // como si fueran de un usuario anónimo).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelado) return;
      if (session) supabase.realtime.setAuth(session.access_token);

      canal = supabase
        .channel(`project-messages-${projectId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "project_messages",
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            const fila = payload.new as {
              id: string;
              sender_id: string | null;
              body: string;
              created_at: string;
            };
            if (todosRef.current.some((m) => m.id === fila.id)) return;
            setEnVivo((prev) => [
              ...prev,
              {
                id: fila.id,
                body: fila.body,
                created_at: fila.created_at,
                senderId: fila.sender_id,
                senderNombre: fila.sender_id ? (participantNames[fila.sender_id] ?? "Alguien") : null,
                esMio: fila.sender_id === currentUserId,
              },
            ]);
          },
        )
        .subscribe();
    });

    return () => {
      cancelado = true;
      if (canal) supabase.removeChannel(canal);
    };
  }, [projectId, currentUserId, participantNames]);

  // Limpia el campo y baja el scroll al fondo cuando se envía con éxito.
  useEffect(() => {
    if (enviado.current && !state.error) {
      formRef.current?.reset();
    }
    enviado.current = true;
  }, [state]);

  // Baja el scroll al fondo cada vez que aparece un mensaje nuevo (propio o
  // recibido en vivo) — sin esto, uno nuevo podía quedar fuera de vista.
  useEffect(() => {
    const el = listaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [todos.length]);

  const fill = variant === "fill";

  return (
    <div className={cn("flex flex-col gap-4", fill && "h-full min-h-0")}>
      {todos.length === 0 ? (
        <p
          className={cn(
            "text-sm text-muted",
            fill && "flex flex-1 items-center justify-center text-center",
          )}
        >
          Todavía no hay mensajes.
        </p>
      ) : (
        <ul
          ref={listaRef}
          className={cn(
            // `pr-3 -mr-3`: separa las burbujas de la barra de scroll (si no,
            // una burbuja alineada a la derecha queda pegada justo contra
            // ella) sin correr toda la lista hacia la izquierda — el margen
            // negativo devuelve ese espacio extra al borde del contenedor.
            "flex flex-col gap-3 overflow-y-auto pr-3 -mr-3",
            fill ? "flex-1 min-h-0" : "max-h-72",
          )}
        >
          {todos.map((m) => (
            <li
              key={m.id}
              className={cn(
                // Tope fijo, no relativo al contenedor: el hilo ahora puede
                // vivir a todo el ancho de la página, y un mensaje corto no
                // debería estirarse en una burbuja gigante solo porque hay
                // espacio disponible.
                "flex max-w-[85%] flex-col gap-1 sm:max-w-md",
                m.esMio ? "self-end items-end" : "self-start items-start",
              )}
            >
              {/* Fecha/hora arriba de la burbuja, no metida adentro — mismo
                  criterio que el chat de tareas de Microsoft Planner. */}
              <span className="text-[10px] text-muted">{haceCuanto(m.created_at)}</span>
              <div
                className={cn(
                  "rounded-lg px-3 py-2 text-sm",
                  m.esMio ? "bg-electric text-white" : "bg-surface text-ink",
                )}
              >
                {!m.esMio && (
                  <p className="text-xs font-semibold opacity-70">
                    {m.senderNombre ?? "Alguien"}
                  </p>
                )}
                <p className="whitespace-pre-line">{m.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form ref={formRef} action={formAction} className="flex shrink-0 flex-col gap-2">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="redirectPath" value={redirectPath} />
        {/* Una sola caja con borde: el texto arriba (sin borde propio) y una
            franja angosta abajo para el botón — así nunca se tocan, ni
            flotando encima del texto ni compitiendo por el mismo ancho.
            Mismo criterio que el chat de tareas de Microsoft Planner. */}
        {/* Solo el borde cambia de color al enfocar, sin el halo grueso que
            usa el resto de los campos del sitio — acá se sentía pesado para
            una caja de chat. */}
        <div className="flex flex-col rounded-md border border-border bg-white transition-colors focus-within:border-electric">
          <textarea
            name="body"
            required
            maxLength={2000}
            placeholder="Escribe un mensaje…"
            className="h-20 w-full resize-none border-0 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:outline-none"
          />
          <div className="flex items-center justify-end border-t border-border px-2 py-1.5">
            <BotonEnviar />
          </div>
        </div>
        {state.error && (
          <p role="alert" className="text-xs text-coral">
            {state.error}
          </p>
        )}
      </form>
    </div>
  );
}
