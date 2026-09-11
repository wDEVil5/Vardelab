import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { getUsersForAdmin } from "@/features/admin/queries";
import { UsersTable } from "@/features/admin/components/users-table";

export const metadata: Metadata = {
  title: "Usuarios y permisos · CampusLab",
};

/**
 * Gestión de usuarios y permisos (D-03, RF-16). Sin columna de "verificación"
 * del mockup original: no existe un concepto de verificación por usuario en el
 * modelo (solo las organizaciones se verifican); se dejó afuera en vez de
 * inventar un campo.
 */
export default async function AdminUsuariosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");
  if (!user.esAdmin) redirect("/");

  const usuarios = await getUsersForAdmin();

  const totales = usuarios.length;
  const estudiantes = usuarios.filter((u) => u.rolPrincipal === "estudiante").length;
  const patrocinadores = usuarios.filter((u) => u.rolPrincipal === "patrocinador").length;
  const suspendidas = usuarios.filter((u) => u.suspendido).length;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Usuarios y permisos
        </h1>
        <p className="mt-1.5 text-muted">
          Administra el acceso, los roles y el estado de las cuentas del piloto.
        </p>
      </header>

      <div className="mt-9 grid grid-cols-2 gap-5 lg:grid-cols-4">
        <Kpi value={totales} label="Usuarios totales" />
        <Kpi value={estudiantes} label="Estudiantes" />
        <Kpi value={patrocinadores} label="Patrocinadores" />
        <Kpi value={suspendidas} label="Cuentas suspendidas" tone="danger" />
      </div>

      <div className="mt-9">
        <UsersTable users={usuarios} currentUserId={user.id} />
      </div>

      <div className="mt-7 flex flex-col items-start justify-between gap-4 rounded-2xl border border-electric/20 bg-electric/5 p-7 sm:flex-row sm:items-center">
        <div>
          <p className="font-semibold text-ink">Acciones protegidas</p>
          <p className="mt-1 text-sm text-muted">
            Cambiar roles o suspender cuentas exige confirmación y genera un evento de auditoría.
          </p>
        </div>
        <Link
          href="/admin/auditoria"
          className="shrink-0 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-electric/40"
        >
          Ver auditoría →
        </Link>
      </div>
    </div>
  );
}

function Kpi({
  value,
  label,
  tone = "ink",
}: {
  value: number;
  label: string;
  tone?: "ink" | "danger";
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <p className={`text-3xl font-bold ${tone === "danger" ? "text-coral" : "text-ink"}`}>
        {value}
      </p>
      <p className="mt-1.5 text-sm text-muted">{label}</p>
    </div>
  );
}
