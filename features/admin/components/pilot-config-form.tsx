"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { buttonClasses } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { updatePilotConfig, type PilotConfigState } from "@/features/admin/actions";
import type { PilotConfig, ConfigChangeHistory } from "@/features/admin/queries";

// Fecha y hora por separado (no un único formateador): el resto del panel
// (D-03, D-04) separa dato por dato con "·" — "Admin · Marcos Iturra" — en
// vez de la coma que Intl mete por defecto entre fecha y hora.
const FORMATO_DIA = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const FORMATO_HORA = new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit" });

/**
 * Reglas y notificaciones son objetos separados: cada uno se compara aparte
 * contra `config` para armar el conteo de "cambios sin guardar". El padre
 * monta este componente con `key={config.updated_at}` (ver la página), así
 * que un guardado exitoso — que revalida la página y trae `config` fresco —
 * reinicia todo el estado local automáticamente en vez de arrastrar valores
 * viejos.
 */
export function PilotConfigForm({
  config,
  historial,
}: {
  config: PilotConfig;
  historial: ConfigChangeHistory;
}) {
  const [state, formAction] = useActionState<PilotConfigState, FormData>(
    updatePilotConfig,
    {},
  );

  const [reglas, setReglas] = useState({
    registroAbierto: config.registro_abierto,
    moderacionPreviaObligatoria: config.moderacion_previa_obligatoria,
    patrocinadoresExternos: config.patrocinadores_externos,
    autoaprobacionProyectos: config.autoaprobacion_proyectos,
  });
  const [notif, setNotif] = useState({
    notifPostulacionRecibida: config.notif_postulacion_recibida,
    notifHitoProximoVencer: config.notif_hito_proximo_vencer,
    notifRespuestaModeracion: config.notif_respuesta_moderacion,
    notifResumenSemanal: config.notif_resumen_semanal,
  });

  const cambios =
    Number(reglas.registroAbierto !== config.registro_abierto) +
    Number(reglas.moderacionPreviaObligatoria !== config.moderacion_previa_obligatoria) +
    Number(reglas.patrocinadoresExternos !== config.patrocinadores_externos) +
    Number(reglas.autoaprobacionProyectos !== config.autoaprobacion_proyectos) +
    Number(notif.notifPostulacionRecibida !== config.notif_postulacion_recibida) +
    Number(notif.notifHitoProximoVencer !== config.notif_hito_proximo_vencer) +
    Number(notif.notifRespuestaModeracion !== config.notif_respuesta_moderacion) +
    Number(notif.notifResumenSemanal !== config.notif_resumen_semanal);

  function descartar() {
    setReglas({
      registroAbierto: config.registro_abierto,
      moderacionPreviaObligatoria: config.moderacion_previa_obligatoria,
      patrocinadoresExternos: config.patrocinadores_externos,
      autoaprobacionProyectos: config.autoaprobacion_proyectos,
    });
    setNotif({
      notifPostulacionRecibida: config.notif_postulacion_recibida,
      notifHitoProximoVencer: config.notif_hito_proximo_vencer,
      notifRespuestaModeracion: config.notif_respuesta_moderacion,
      notifResumenSemanal: config.notif_resumen_semanal,
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {Object.entries(reglas).map(([campo, valor]) => (
        <input key={campo} type="hidden" name={campo} value={String(valor)} />
      ))}
      {Object.entries(notif).map(([campo, valor]) => (
        <input key={campo} type="hidden" name={campo} value={String(valor)} />
      ))}

      {/* Dos columnas independientes (no una grilla 2x2): así la altura de
          "Reglas operativas" no le hereda espacio vacío a "Notificaciones",
          que es más corta — cada columna apila sus tarjetas a su propio
          ritmo. */}
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-7">
          <h2 className="font-semibold text-ink">Reglas operativas</h2>
          <p className="mt-1.5 text-sm text-muted">
            Controles que protegen calidad, seguridad y alcance.
          </p>

          <div className="mt-6 flex flex-col gap-5">
            <ReglaToggle
              titulo="Registro de nuevas cuentas"
              nota="Si se apaga, nadie puede crear una cuenta nueva (estudiante o patrocinador)"
              checked={reglas.registroAbierto}
              onChange={(v) => setReglas((r) => ({ ...r, registroAbierto: v }))}
            />
            <ReglaToggle
              titulo="Moderación previa obligatoria"
              nota="Todo proyecto pasa por revisión antes de publicarse"
              checked={reglas.moderacionPreviaObligatoria}
              onChange={(v) => setReglas((r) => ({ ...r, moderacionPreviaObligatoria: v }))}
            />
            <ReglaToggle
              titulo="Patrocinadores externos"
              nota="Permitir crear organizaciones que no son internas del piloto"
              checked={reglas.patrocinadoresExternos}
              onChange={(v) => setReglas((r) => ({ ...r, patrocinadoresExternos: v }))}
            />
            <ReglaToggle
              titulo="Autoaprobación de proyectos"
              nota="No recomendada durante el piloto. Si está activa, un proyecto se publica sin pasar por moderación, aunque 'Moderación previa obligatoria' esté encendida."
              checked={reglas.autoaprobacionProyectos}
              onChange={(v) => setReglas((r) => ({ ...r, autoaprobacionProyectos: v }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-border bg-white p-7">
            <h2 className="font-semibold text-ink">Notificaciones</h2>
            <p className="mt-1.5 text-sm text-muted">
              Mantén los avisos útiles y evita saturar a los usuarios.
            </p>

            <div className="mt-6 flex flex-col gap-5">
              <ReglaToggle
                titulo="Postulación recibida"
                checked={notif.notifPostulacionRecibida}
                onChange={(v) => setNotif((n) => ({ ...n, notifPostulacionRecibida: v }))}
              />
              <ReglaToggle
                titulo="Hito próximo a vencer"
                checked={notif.notifHitoProximoVencer}
                onChange={(v) => setNotif((n) => ({ ...n, notifHitoProximoVencer: v }))}
              />
              <ReglaToggle
                titulo="Respuesta de moderación"
                checked={notif.notifRespuestaModeracion}
                onChange={(v) => setNotif((n) => ({ ...n, notifRespuestaModeracion: v }))}
              />
              <ReglaToggle
                titulo="Resumen semanal"
                checked={notif.notifResumenSemanal}
                onChange={(v) => setNotif((n) => ({ ...n, notifResumenSemanal: v }))}
              />
            </div>
            <p className="mt-6 border-t border-border pt-4 text-xs text-muted">
              El envío real todavía no está conectado (depende del correo transaccional,
              pendiente). Por ahora estas preferencias solo quedan guardadas.
            </p>
          </div>

          <div className="rounded-2xl border border-electric/15 bg-electric/5 p-7">
            <h2 className="font-semibold text-ink">Gobernanza y trazabilidad</h2>
            <p className="mt-1.5 text-sm text-muted">
              Los cambios sensibles no se aplican silenciosamente.
            </p>

            <div className="mt-6 flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-electric">
                i
              </span>
              <p className="text-sm text-ink">
                Cada guardado genera un evento con actor, fecha y los campos modificados.
              </p>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Últimos cambios
              </p>
              {historial.cambios.length === 0 ? (
                <p className="mt-1.5 text-sm text-muted">Sin cambios registrados todavía.</p>
              ) : (
                // Lista con un tope fijo (la query ya trae solo `limit` filas), no
                // "todo el historial": una tarjeta de resumen que crezca sin límite
                // a medida que pasan los meses del piloto dejaría de ser un
                // resumen. El link de abajo es la salida hacia el detalle completo.
                <ul className="mt-2 flex flex-col divide-y divide-electric/10">
                  {historial.cambios.map((c) => (
                    <li key={c.id} className="py-2.5 first:pt-0 last:pb-0">
                      <p className="text-sm font-medium text-ink">
                        {c.actorNombre} ·{" "}
                        {FORMATO_DIA.format(new Date(c.createdAt))} ·{" "}
                        {FORMATO_HORA.format(new Date(c.createdAt))}
                      </p>
                      {c.campos.length > 0 && (
                        <p className="mt-0.5 text-xs text-muted">{c.campos.join(", ")}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {historial.masDisponibles && (
                <Link
                  href="/admin/auditoria"
                  className="mt-3 inline-block text-sm font-medium text-electric hover:underline"
                >
                  Ver historial completo en auditoría →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {cambios > 0 && (
        <div className="flex flex-col gap-4 rounded-2xl border border-amber-300 bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-ink">
              {cambios} {cambios === 1 ? "cambio sin guardar" : "cambios sin guardar"}
            </p>
            <p className="mt-1 text-sm text-muted">
              Revisa las reglas y notificaciones antes de confirmar.
            </p>
            {state.error && <p className="mt-2 text-sm text-coral">{state.error}</p>}
          </div>
          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              onClick={descartar}
              className={buttonClasses({ variant: "outline", size: "md" })}
            >
              Descartar
            </button>
            <SubmitButton pendingText="Guardando…">Guardar cambios</SubmitButton>
          </div>
        </div>
      )}
    </form>
  );
}

function ReglaToggle({
  titulo,
  nota,
  checked,
  onChange,
}: {
  titulo: string;
  nota?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{titulo}</p>
        {nota && <p className="mt-0.5 text-xs text-muted">{nota}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} label={titulo} />
    </div>
  );
}
