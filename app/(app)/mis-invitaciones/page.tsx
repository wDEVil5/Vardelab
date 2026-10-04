import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import {
  getMyOwnershipOffers,
  getMyPendingInvitations,
} from "@/features/organizations/queries";
import { InvitationActions } from "@/features/organizations/components/invitation-actions";
import { OwnershipOfferActions } from "@/features/organizations/components/ownership-offer-actions";

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
  const ofertas = await getMyOwnershipOffers();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 lg:py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Invitaciones</h1>
      <p className="mt-1 text-sm text-muted">
        Organizaciones que te invitaron a co-gestionarlas. No tienes acceso hasta que las aceptes.
      </p>

      {ofertas.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-ink">Te ofrecieron ser dueño</h2>
          <p className="mt-1 text-xs text-muted">
            Si aceptas, pasas a ser el dueño de la organización y quien te la ofreció pasa a ser miembro.
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {ofertas.map((oferta) => (
              <li
                key={oferta.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-electric/30 bg-electric/5 p-5"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">{oferta.nombre}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {oferta.ofrecidaPor ? `Te la ofreció ${oferta.ofrecidaPor} · ` : ""}
                    {FORMATO_FECHA.format(new Date(oferta.createdAt))}
                  </p>
                </div>
                <OwnershipOfferActions offerId={oferta.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="mt-8 text-sm font-semibold text-ink">Invitaciones a co-gestionar</h2>

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
