import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { VerifiedInfoBadge } from "@/components/ui/verified-info-popover";
import { getCurrentUser } from "@/features/auth/queries";
import { getOrganizationDetailForAdmin } from "@/features/admin/queries";
import { OrgVerificationActions } from "@/features/admin/components/org-verification-actions";
import { externalUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Detalle de la organización · CampusLab",
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

type PageProps = { params: Promise<{ id: string }> };

/**
 * Detalle de una organización para el admin: datos institucionales, sus
 * proyectos (para tener contexto real antes de decidir), y — si está
 * `en_revision` — el bloque para aprobar o rechazar la verificación (M62).
 */
export default async function AdminOrganizacionDetallePage({ params }: PageProps) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  if (!user.esAdmin) redirect("/");

  const org = await getOrganizationDetailForAdmin(id);
  if (!org) notFound();

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
