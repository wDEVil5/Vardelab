"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel";
import { AuthFormPanel } from "@/features/auth/components/auth-form-panel";
import { AuthRolProvider, useAuthRol } from "@/features/auth/components/auth-rol-context";
import { AuthSplitFrame } from "@/features/auth/components/auth-split-frame";
import type { Rol } from "@/features/auth/components/signup-form";
import type { ProjectCard as ProjectCardData } from "@/features/projects/queries";

const EASE = [0.22, 1, 0.36, 1] as const;

const COPY_INGRESAR = {
  title: (
    <>
      Desafíos reales.
      <span className="mt-1 block font-semibold text-white/90">
        Talento que se demuestra.
      </span>
    </>
  ),
  description:
    "CampusLab conecta estudiantes con organizaciones para resolver microproyectos claros, con objetivos y acompañamiento.",
} as const;

const COPY_REGISTRO: Record<
  Rol,
  { title: string; description: string }
> = {
  estudiante: {
    title: "Desafíos reales. Talento que se demuestra.",
    description:
      "Crea tu perfil, postula a un rol concreto y colabora en un microdesafío acotado.",
  },
  patrocinador: {
    title: "Publica una necesidad con alcance claro.",
    description:
      "Define roles, plazo y entregable. Forma equipo estudiantil y acompaña el trabajo por hitos.",
  },
};

function AuthEntryShellInner({
  projects,
  children,
}: {
  projects: ProjectCardData[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const { rol } = useAuthRol();
  const isRegistro = pathname.startsWith("/registro");

  const brand = isRegistro
    ? {
        title: COPY_REGISTRO[rol].title,
        description: COPY_REGISTRO[rol].description,
        audience: rol,
        contentKey: `registro-${rol}`,
      }
    : {
        title: COPY_INGRESAR.title,
        description: COPY_INGRESAR.description,
        audience: "estudiante" as const,
        contentKey: "ingresar",
      };

  return (
    <AuthSplitFrame>
      <AuthBrandPanel
        title={brand.title}
        description={brand.description}
        audience={brand.audience}
        contentKey={brand.contentKey}
        projects={projects}
      />

      <AuthFormPanel>
        {/* Solo opacidad: el layout queda montado al ir ingresar ↔ registro. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </AuthFormPanel>
    </AuthSplitFrame>
  );
}

/**
 * Shell compartido de /ingresar y /registro: panel izquierdo y marco oscuro
 * permanecen montados; solo el formulario cruza con fade (sin blur).
 */
export function AuthEntryShell({
  projects,
  children,
}: {
  projects: ProjectCardData[];
  children: ReactNode;
}) {
  return (
    <AuthRolProvider>
      <AuthEntryShellInner projects={projects}>{children}</AuthEntryShellInner>
    </AuthRolProvider>
  );
}
