export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      applications: {
        Row: {
          applicant_id: string
          created_at: string
          disponibilidad: string | null
          evidencia: string | null
          id: string
          mensaje: string | null
          project_role_id: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          applicant_id: string
          created_at?: string
          disponibilidad?: string | null
          evidencia?: string | null
          id?: string
          mensaje?: string | null
          project_role_id: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          created_at?: string
          disponibilidad?: string | null
          evidencia?: string | null
          id?: string
          mensaje?: string | null
          project_role_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_project_role_id_fkey"
            columns: ["project_role_id"]
            isOneToOne: false
            referencedRelation: "project_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          accion: string
          actor_id: string | null
          created_at: string
          entidad: string | null
          entidad_id: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          accion: string
          actor_id?: string | null
          created_at?: string
          entidad?: string | null
          entidad_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          accion?: string
          actor_id?: string | null
          created_at?: string
          entidad?: string | null
          entidad_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      evaluations: {
        Row: {
          comentario: string | null
          created_at: string
          criterios: Json | null
          evaluatee_id: string
          evaluator_id: string | null
          id: string
          project_id: string
          puntaje: number | null
          updated_at: string
        }
        Insert: {
          comentario?: string | null
          created_at?: string
          criterios?: Json | null
          evaluatee_id: string
          evaluator_id?: string | null
          id?: string
          project_id: string
          puntaje?: number | null
          updated_at?: string
        }
        Update: {
          comentario?: string | null
          created_at?: string
          criterios?: Json | null
          evaluatee_id?: string
          evaluator_id?: string | null
          id?: string
          project_id?: string
          puntaje?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string
          estado: Database["public"]["Enums"]["lead_estado"]
          id: string
          mensaje: string
          nombre: string
          organizacion: string | null
          tipo: Database["public"]["Enums"]["lead_tipo"]
        }
        Insert: {
          created_at?: string
          email: string
          estado?: Database["public"]["Enums"]["lead_estado"]
          id?: string
          mensaje: string
          nombre: string
          organizacion?: string | null
          tipo: Database["public"]["Enums"]["lead_tipo"]
        }
        Update: {
          created_at?: string
          email?: string
          estado?: Database["public"]["Enums"]["lead_estado"]
          id?: string
          mensaje?: string
          nombre?: string
          organizacion?: string | null
          tipo?: Database["public"]["Enums"]["lead_tipo"]
        }
        Relationships: []
      }
      milestones: {
        Row: {
          created_at: string
          descripcion: string | null
          estado: Database["public"]["Enums"]["milestone_status"]
          fecha_limite: string | null
          id: string
          orden: number
          project_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["milestone_status"]
          fecha_limite?: string | null
          id?: string
          orden?: number
          project_id: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["milestone_status"]
          fecha_limite?: string | null
          id?: string
          orden?: number
          project_id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          contacto: string | null
          created_at: string
          descripcion: string | null
          id: string
          logo_url: string | null
          nombre: string
          owner_id: string
          sitio_web: string | null
          tipo: Database["public"]["Enums"]["org_type"]
          updated_at: string
          verificacion: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          contacto?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          logo_url?: string | null
          nombre: string
          owner_id: string
          sitio_web?: string | null
          tipo: Database["public"]["Enums"]["org_type"]
          updated_at?: string
          verificacion?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          contacto?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          logo_url?: string | null
          nombre?: string
          owner_id?: string
          sitio_web?: string | null
          tipo?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
          verificacion?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          profile_id: string
          project_id: string | null
          titulo: string
          updated_at: string
          url: string | null
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          profile_id: string
          project_id?: string | null
          titulo: string
          updated_at?: string
          url?: string | null
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          profile_id?: string
          project_id?: string | null
          titulo?: string
          updated_at?: string
          url?: string | null
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_skills: {
        Row: {
          created_at: string
          evidencia: string | null
          id: string
          nivel: Database["public"]["Enums"]["skill_level"] | null
          profile_id: string
          skill_id: string
        }
        Insert: {
          created_at?: string
          evidencia?: string | null
          id?: string
          nivel?: Database["public"]["Enums"]["skill_level"] | null
          profile_id: string
          skill_id: string
        }
        Update: {
          created_at?: string
          evidencia?: string | null
          id?: string
          nivel?: Database["public"]["Enums"]["skill_level"] | null
          profile_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          carrera: string | null
          created_at: string
          disponibilidad: string | null
          enlaces: Json
          id: string
          intereses: string | null
          nombre: string | null
          semestre: number | null
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          carrera?: string | null
          created_at?: string
          disponibilidad?: string | null
          enlaces?: Json
          id: string
          intereses?: string | null
          nombre?: string | null
          semestre?: number | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          carrera?: string | null
          created_at?: string
          disponibilidad?: string | null
          enlaces?: Json
          id?: string
          intereses?: string | null
          nombre?: string | null
          semestre?: number | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: []
      }
      project_role_skills: {
        Row: {
          created_at: string
          id: string
          nivel_minimo: Database["public"]["Enums"]["skill_level"] | null
          project_role_id: string
          skill_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nivel_minimo?: Database["public"]["Enums"]["skill_level"] | null
          project_role_id: string
          skill_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nivel_minimo?: Database["public"]["Enums"]["skill_level"] | null
          project_role_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_role_skills_project_role_id_fkey"
            columns: ["project_role_id"]
            isOneToOne: false
            referencedRelation: "project_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_role_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      project_roles: {
        Row: {
          created_at: string
          cupos: number
          descripcion: string | null
          id: string
          nombre: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cupos?: number
          descripcion?: string | null
          id?: string
          nombre: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cupos?: number
          descripcion?: string | null
          id?: string
          nombre?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_roles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          alcance: string | null
          created_at: string
          created_by: string | null
          descripcion: string | null
          duracion_semanas: number | null
          entregable: string | null
          expectativas: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          modalidad: Database["public"]["Enums"]["project_modality"] | null
          org_id: string
          problema: string | null
          resumen: string | null
          status: Database["public"]["Enums"]["project_status"]
          titulo: string
          updated_at: string
        }
        Insert: {
          alcance?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          duracion_semanas?: number | null
          entregable?: string | null
          expectativas?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          modalidad?: Database["public"]["Enums"]["project_modality"] | null
          org_id: string
          problema?: string | null
          resumen?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          titulo: string
          updated_at?: string
        }
        Update: {
          alcance?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          duracion_semanas?: number | null
          entregable?: string | null
          expectativas?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          modalidad?: Database["public"]["Enums"]["project_modality"] | null
          org_id?: string
          problema?: string | null
          resumen?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          motivo: string
          reporter_id: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string | null
          target_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          motivo: string
          reporter_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string | null
          target_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          motivo?: string
          reporter_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string | null
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          activo: boolean
          categoria: string
          created_at: string
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          categoria: string
          created_at?: string
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          categoria?: string
          created_at?: string
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          archivo_url: string | null
          created_at: string
          id: string
          milestone_id: string
          nota: string | null
          submitted_by: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          archivo_url?: string | null
          created_at?: string
          id?: string
          milestone_id: string
          nota?: string | null
          submitted_by?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          archivo_url?: string | null
          created_at?: string
          id?: string
          milestone_id?: string
          nota?: string | null
          submitted_by?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          contribucion: string | null
          created_at: string
          id: string
          project_role_id: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          contribucion?: string | null
          created_at?: string
          id?: string
          project_role_id?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          contribucion?: string | null
          created_at?: string
          id?: string
          project_role_id?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_project_role_id_fkey"
            columns: ["project_role_id"]
            isOneToOne: false
            referencedRelation: "project_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["team_status"]
          fecha_inicio: string | null
          id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["team_status"]
          fecha_inicio?: string | null
          id?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["team_status"]
          fecha_inicio?: string | null
          id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_project: { Args: { _project_id: string }; Returns: boolean }
      can_manage_role: { Args: { _role_id: string }; Returns: boolean }
      can_manage_team: { Args: { _team_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_project_member: { Args: { _project_id: string }; Returns: boolean }
      is_team_member: { Args: { _team_id: string }; Returns: boolean }
      manages_applicant: { Args: { _applicant_id: string }; Returns: boolean }
      owns_org: { Args: { _org_id: string }; Returns: boolean }
      shares_team_with: { Args: { _other: string }; Returns: boolean }
    }
    Enums: {
      app_role: "estudiante" | "patrocinador" | "mentor" | "moderador" | "admin"
      application_status: "enviada" | "aceptada" | "rechazada" | "retirada"
      lead_estado: "nuevo" | "contactado" | "descartado"
      lead_tipo: "contacto_organizacion" | "propuesta_desafio"
      milestone_status: "pendiente" | "en_progreso" | "entregado" | "aprobado"
      org_type:
        | "academica"
        | "social"
        | "emprendimiento"
        | "empresa"
        | "interna"
      project_modality: "presencial" | "remoto" | "hibrido"
      project_status:
        | "borrador"
        | "en_revision"
        | "publicado"
        | "seleccion"
        | "activo"
        | "revision_final"
        | "completado"
        | "suspendido"
        | "cancelado"
      report_status: "abierto" | "en_revision" | "resuelto"
      skill_level: "basico" | "intermedio" | "avanzado"
      team_status: "formando" | "activo" | "finalizado"
      verification_status: "sin_verificar" | "en_revision" | "verificado"
      visibility: "publico" | "privado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["estudiante", "patrocinador", "mentor", "moderador", "admin"],
      application_status: ["enviada", "aceptada", "rechazada", "retirada"],
      lead_estado: ["nuevo", "contactado", "descartado"],
      lead_tipo: ["contacto_organizacion", "propuesta_desafio"],
      milestone_status: ["pendiente", "en_progreso", "entregado", "aprobado"],
      org_type: ["academica", "social", "emprendimiento", "empresa", "interna"],
      project_modality: ["presencial", "remoto", "hibrido"],
      project_status: [
        "borrador",
        "en_revision",
        "publicado",
        "seleccion",
        "activo",
        "revision_final",
        "completado",
        "suspendido",
        "cancelado",
      ],
      report_status: ["abierto", "en_revision", "resuelto"],
      skill_level: ["basico", "intermedio", "avanzado"],
      team_status: ["formando", "activo", "finalizado"],
      verification_status: ["sin_verificar", "en_revision", "verificado"],
      visibility: ["publico", "privado"],
    },
  },
} as const

