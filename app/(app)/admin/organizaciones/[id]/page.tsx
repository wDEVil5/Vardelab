import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { VerifiedInfoBadge } from "@/components/ui/verified-info-popover";
import { getOrganizationDetailForAdmin } from "@/features/admin/queries";
import { OrgVerificationActions } from "@/features/admin/components/org-verification-actions";
import { AdminOwnershipOfferForm } from "@/features/admin/components/admin-ownership-offer-form";
import { PendingOwnershipOffer } from "@/features/organizations/components/pending-ownership-offer";
import {
  getOrganizationMembers,
  getPendingOwnershipOffer,
} from "@/features/organizations/queries";
import { externalUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Detalle de la organización · Vardelab",
};

const VERIFICACION_TONE: Record<string, BadgeTone> = {
  verificado: "success",
  en_revision: "brand",
  sin_verificar: "neutral",
};

const ESTADO_TONE: Record<string, BadgeTone> = {
  borrador: "neutral",
  en_revision: "brand",
  publicado: "success",
  seleccion: "brand",
  activo: "success",
  revision_final: "brand",
  completado: "success",
  suspendido: "danger",
  cancelado: "danger",
};

const FORMATO_FECHA = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

// Guía de lectura antes de aprobar/rechazar: no son casilleros que bloquean el
// botón, es un recordatorio de qué mirar (mismo patrón que la guía de
// admisión de proyectos en /moderacion/[id]). Verificar una organización
// significa "identidad y vínculo revisados", no un aval institucional ni una
// garantía de calidad — decisión del piloto, propuesta de REGLAS_NEGOCIO.md
// ("Personas, cuentas y organizaciones").
const GUIA_VERIFICACION = [
  "La organización existe de verdad: el sitio web o el correo de contacto corresponden a algo real, no a un perfil inventado para el piloto.",
  "Quien la registró tiene un vínculo real con ella — no es alguien ajeno reclamándola sin autorización.",
  "Verificar no es avalar la calidad ni la idoneidad institucional de la organización, solo que existe y que quien la representa es quien dice ser.",
  "Antes de que publique un desafío, queda claro quién va a ser el contacto y quién va a validar el resultado.",
];

type PageProps = { params: Promise<{ id: string }> };

/**
 * Detalle de una organización para el admin: datos institucionales, sus
 * proyectos (para tener contexto real antes de decidir), y — si está
 * `en_revision` — el bloque para aprobar o rechazar la verificación (M62).
 */
export default async function AdminOrganizacionDetallePage({ params }: PageProps) {
  const { id } = await params;

  const org = await getOrganizationDetailForAdmin(id);
  if (!org) notFound();

  const [miembros, oferta] = await Promise.all([
    getOrganizationMembers(org.id),
    getPendingOwnershipOffer(org.id),
  ]);
  const miembrosActivos = miembros
    .filter((m): m is typeof m & { user_id: string } => m.status === "activo" && Boolean(m.user_id))
    .map((m) => ({ userId: m.user_id, etiqueta: m.nombre ?? m.invited_email }));

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10 lg:py-12">
      <Link
        href="/admin/organizaciones"
        className="text-sm font-medium text-muted hover:text-ink"
      >
        ← Volver a organizaciones
      </Link>

      <div className="mt-4 rounded-2xl border border-border bg-white p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex flex-wrap items-center gap-1.5 text-2xl font-semibold tracking-tight text-ink">
              {org.nombre}
              {org.verificacion === "verificado" && <VerifiedInfoBadge tipo={org.tipo} />}
            </h1>
            <p className="mt-1 text-sm text-muted">{org.etiquetaTipo}</p>
          </div>
          <Badge tone={VERIFICACION_TONE[org.verificacion] ?? "neutral"}>
            {org.etiquetaVerificacion}
          </Badge>
        </div>

        <div className="mt-4">
          <a
            href={`/organizaciones/${org.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-electric hover:underline"
          >
            Ver perfil público ↗
          </a>
        </div>

        {org.descripcion && <p className="mt-5 text-sm text-ink">{org.descripcion}</p>}

        <dl className="mt-6 grid grid-cols-2 gap-5 border-t border-border pt-5 sm:grid-cols-3">
          <Campo label="Sitio web">
            {org.sitio_web ? (
              <a href={externalUrl(org.sitio_web)} target="_blank" rel="noopener noreferrer" className="text-electric hover:underline">
                {org.sitio_web}
              </a>
            ) : (
              "—"
            )}
          </Campo>
          <Campo label="Contacto">{org.contacto || "—"}</Campo>
          <Campo label="Correo de contacto">{org.contacto_email || "—"}</Campo>
        </dl>

        {org.verificacion === "en_revision" && (
          <div className="mt-6 border-t border-border pt-6">
            <h3 className="text-sm font-semibold text-ink">Antes de decidir</h3>
            <ul className="mt-3 flex flex-col gap-3">
              {GUIA_VERIFICACION.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-electric/10 text-electric">
                    <svg
                      viewBox="0 0 24 24"
                      className="size-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  <span className="text-sm leading-relaxed text-ink">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-white p-7">
        <h2 className="font-semibold text-ink">Propiedad</h2>
        <p className="mt-1 text-sm text-muted">
          Dueño actual:{" "}
          <span className="font-medium text-ink">{org.duenoNombre ?? "Sin nombre registrado"}</span>
        </p>
        <div className="mt-4 flex flex-col gap-4">
          {oferta && (
            <PendingOwnershipOffer offerId={oferta.id} orgId={org.id} nombre={oferta.nombre} />
          )}
          <AdminOwnershipOfferForm orgId={org.id} miembros={miembrosActivos} />
        </div>
        <p className="mt-4 text-xs text-muted">
          Para rescatar una organización sin dueño activo. La persona recibe la oferta y la
          propiedad cambia solo cuando la acepta.
        </p>
      </div>

      {org.verificacion === "en_revision" && (
        <div className="mt-5">
          <OrgVerificationActions orgId={org.id} />
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-white">
        <h2 className="p-7 pb-0 font-semibold text-ink">Proyectos ({org.proyectos.length})</h2>
        {org.proyectos.length === 0 ? (
          <p className="p-7 pt-2 text-sm text-muted">Todavía no tiene proyectos.</p>
        ) : (
          <div className="mt-4 max-h-105 overflow-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-y border-border text-xs uppercase tracking-wide text-muted">
                  <th className="px-7 py-4 font-medium">Proyecto</th>
                  <th className="px-7 py-4 font-medium">Estado</th>
                  <th className="px-7 py-4 font-medium">Modalidad</th>
                  <th className="px-7 py-4 font-medium">Cupos</th>
                  <th className="px-7 py-4 font-medium">Creado</th>
                  <th className="px-7 py-4 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {org.proyectos.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-surface/50">
                    <td className="px-7 py-5 font-medium text-ink">{p.titulo}</td>
                    <td className="px-7 py-5">
                      <Badge tone={ESTADO_TONE[p.status] ?? "neutral"}>{p.etiquetaEstado}</Badge>
                    </td>
                    <td className="px-7 py-5 text-muted">{p.etiquetaModalidad}</td>
                    <td className="px-7 py-5 text-muted">{p.cupos}</td>
                    <td className="px-7 py-5 whitespace-nowrap text-muted">
                      {FORMATO_FECHA.format(new Date(p.createdAt))}
                    </td>
                    <td className="px-7 py-5">
                      <Link
                        href={`/admin/proyectos/${p.id}`}
                        className="font-medium text-electric hover:underline"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{children}</dd>
    </div>
  );
}
