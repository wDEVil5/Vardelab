import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { getMyPendingInvitations } from "@/features/organizations/queries";
import { InvitationActions } from "@/features/organizations/components/invitation-actions";

export const metadata: Metadata = {
  title: "Invitaciones · Vardelab",
};

const FORMATO_FECHA = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/**
 * Invitaciones a co-gestionar una organización. Nadie queda dentro de una
 * organización sin aceptarla aquí (M110): hasta entonces no tiene acceso.
 */
export default async function MisInvitacionesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?next=/mis-invitaciones");

  const invitaciones = await getMyPendingInvitations();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 lg:py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Invitaciones</h1>
      <p className="mt-1 text-sm text-muted">
        Organizaciones que te invitaron a co-gestionarlas. No tienes acceso hasta que las aceptes.
      </p>

      {invitaciones.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
          <p className="font-medium text-ink">No tienes invitaciones pendientes</p>
          <p className="mt-1 text-sm text-muted">Cuando alguien te invite, aparecerá aquí.</p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {invitaciones.map((inv) => (
            <li
              key={inv.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-white p-5"
            >
              <div className="min-w-0">
                <p className="font-medium text-ink">{inv.nombre}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {inv.invitadoPor ? `Te invitó ${inv.invitadoPor} · ` : ""}
                  {FORMATO_FECHA.format(new Date(inv.createdAt))}
                </p>
              </div>
              <InvitationActions memberId={inv.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
