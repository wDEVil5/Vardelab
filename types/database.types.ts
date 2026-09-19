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
          project_id: string
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
          project_id: string
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
          project_id?: string
          project_role_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
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
      avatar_presets: {
        Row: {
          activo: boolean
          created_at: string
          etiqueta: string
          id: string
          orden: number
          updated_at: string
          url: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          etiqueta: string
          id?: string
          orden?: number
          updated_at?: string
          url: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          etiqueta?: string
          id?: string
          orden?: number
          updated_at?: string
          url?: string
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
          aviso_vencimiento_enviado_at: string | null
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
          aviso_vencimiento_enviado_at?: string | null
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
          aviso_vencimiento_enviado_at?: string | null
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
      notifications: {
        Row: {
          created_at: string
          id: string
          leida: boolean
          link: string | null
          mensaje: string
          tipo: Database["public"]["Enums"]["notification_tipo"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          leida?: boolean
          link?: string | null
          mensaje: string
          tipo: Database["public"]["Enums"]["notification_tipo"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          leida?: boolean
          link?: string | null
          mensaje?: string
          tipo?: Database["public"]["Enums"]["notification_tipo"]
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          invited_email: string
          org_id: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          invited_email: string
          org_id: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          invited_email?: string
          org_id?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          contacto: string | null
          contacto_email: string | null
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
          contacto_email?: string | null
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
          contacto_email?: string | null
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
      pilot_config: {
        Row: {
          autoaprobacion_proyectos: boolean
          id: boolean
          moderacion_previa_obligatoria: boolean
          notif_hito_proximo_vencer: boolean
          notif_postulacion_recibida: boolean
          notif_respuesta_moderacion: boolean
          notif_resumen_semanal: boolean
          patrocinadores_externos: boolean
          registro_abierto: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          autoaprobacion_proyectos?: boolean
          id?: boolean
          moderacion_previa_obligatoria?: boolean
          notif_hito_proximo_vencer?: boolean
          notif_postulacion_recibida?: boolean
          notif_respuesta_moderacion?: boolean
          notif_resumen_semanal?: boolean
          patrocinadores_externos?: boolean
          registro_abierto?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          autoaprobacion_proyectos?: boolean
          id?: boolean
          moderacion_previa_obligatoria?: boolean
          notif_hito_proximo_vencer?: boolean
          notif_postulacion_recibida?: boolean
          notif_respuesta_moderacion?: boolean
          notif_resumen_semanal?: boolean
          patrocinadores_externos?: boolean
          registro_abierto?: boolean
          updated_at?: string
          updated_by?: string | null
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
          cargo: string | null
          carrera: string | null
          created_at: string
          disponibilidad: string | null
          enlaces: Json
          id: string
          intereses: string | null
          moderador_intro_completado: boolean
          nombre: string | null
          onboarding_completado: boolean
          semestre: number | null
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cargo?: string | null
          carrera?: string | null
          created_at?: string
          disponibilidad?: string | null
          enlaces?: Json
          id: string
          intereses?: string | null
          moderador_intro_completado?: boolean
          nombre?: string | null
          onboarding_completado?: boolean
          semestre?: number | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cargo?: string | null
          carrera?: string | null
          created_at?: string
          disponibilidad?: string | null
          enlaces?: Json
          id?: string
          intereses?: string | null
          moderador_intro_completado?: boolean
          nombre?: string | null
          onboarding_completado?: boolean
          semestre?: number | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: []
      }
      project_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          project_id: string
          sender_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          project_id: string
          sender_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          project_id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_observations: {
        Row: {
          categoria: string
          created_at: string
          id: string
          project_id: string
          resuelta: boolean
          texto: string
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: string
          project_id: string
          resuelta?: boolean
          texto: string
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          project_id?: string
          resuelta?: boolean
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
          horas_semanales: number | null
          id: string
          nombre: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cupos?: number
          descripcion?: string | null
          horas_semanales?: number | null
          id?: string
          nombre: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cupos?: number
          descripcion?: string | null
          horas_semanales?: number | null
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
          comentario_moderacion: string | null
          created_at: string
          created_by: string | null
          dedicacion_semanal: string | null
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
          respuesta_patrocinador: string | null
          resumen: string | null
          revisado_at: string | null
          status: Database["public"]["Enums"]["project_status"]
          titulo: string
          updated_at: string
        }
        Insert: {
          alcance?: string | null
          comentario_moderacion?: string | null
          created_at?: string
          created_by?: string | null
          dedicacion_semanal?: string | null
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
          respuesta_patrocinador?: string | null
          resumen?: string | null
          revisado_at?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          titulo: string
          updated_at?: string
        }
        Update: {
          alcance?: string | null
          comentario_moderacion?: string | null
          created_at?: string
          created_by?: string | null
          dedicacion_semanal?: string | null
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
          respuesta_patrocinador?: string | null
          resumen?: string | null
          revisado_at?: string | null
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
      rate_limits: {
        Row: {
          intentos: number
          key: string
          window_start: string
        }
        Insert: {
          intentos?: number
          key: string
          window_start?: string
        }
        Update: {
          intentos?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          motivo: string
          reporter_id: string | null
          resolucion: string | null
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
          resolucion?: string | null
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
          resolucion?: string | null
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
      accept_application: { Args: { _application_id: string }; Returns: string }
      accepted_count_for_role: { Args: { _role_id: string }; Returns: number }
      accepted_counts_for_roles: {
        Args: { _role_ids: string[] }
        Returns: {
          aceptadas: number
          project_role_id: string
        }[]
      }
      admin_organizations_page: {
        Args: {
          _limit?: number
          _offset?: number
          _q?: string
          _verificacion?: string
        }
        Returns: {
          id: string
          total_count: number
        }[]
      }
      admin_projects_page: {
        Args: {
          _limit?: number
          _offset?: number
          _q?: string
          _status?: string
        }
        Returns: {
          id: string
          total_count: number
        }[]
      }
      can_manage_project: { Args: { _project_id: string }; Returns: boolean }
      can_manage_role: { Args: { _role_id: string }; Returns: boolean }
      can_manage_team: { Args: { _team_id: string }; Returns: boolean }
      catalog_skill_facets: {
        Args: never
        Returns: {
          nombre: string
        }[]
      }
      check_rate_limit: {
        Args: { _key: string; _max_intentos: number; _window_seconds: number }
        Returns: boolean
      }
      completed_projects_count: {
        Args: { _profile_id: string }
        Returns: number
      }
      find_user_id_by_email: { Args: { _email: string }; Returns: string }
      has_own_skill: { Args: { _skill_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: { Args: { _org_id: string }; Returns: boolean }
      is_project_member: { Args: { _project_id: string }; Returns: boolean }
      is_team_member: { Args: { _team_id: string }; Returns: boolean }
      manages_applicant: { Args: { _applicant_id: string }; Returns: boolean }
      moderation_queue_page: {
        Args: {
          _limit?: number
          _modalidad?: string
          _offset?: number
          _q?: string
        }
        Returns: {
          id: string
          total_count: number
        }[]
      }
      moderation_queue_stats: {
        Args: never
        Returns: {
          cupos_abiertos: number
          organizaciones: number
          pendientes: number
        }[]
      }
      notificar_hitos_por_vencer: { Args: never; Returns: undefined }
      org_recipient_ids: { Args: { _org_id: string }; Returns: string[] }
      organization_member_roles: {
        Args: { _org_id: string }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      owns_org: { Args: { _org_id: string }; Returns: boolean }
      pilot_autoaprobacion_activa: { Args: never; Returns: boolean }
      pilot_moderacion_obligatoria: { Args: never; Returns: boolean }
      pilot_permite_patrocinadores_externos: { Args: never; Returns: boolean }
      pilot_registro_abierto: { Args: never; Returns: boolean }
      search_published_projects: {
        Args: {
          _limit?: number
          _modalidad?: string
          _offset?: number
          _q?: string
          _skill?: string
        }
        Returns: {
          id: string
          total_count: number
        }[]
      }
      set_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      shares_project_with: { Args: { _other: string }; Returns: boolean }
      shares_team_with: { Args: { _other: string }; Returns: boolean }
    }
    Enums: {
      app_role: "estudiante" | "patrocinador" | "mentor" | "moderador" | "admin"
      application_status:
        | "enviada"
        | "aceptada"
        | "rechazada"
        | "retirada"
        | "removida"
      lead_estado: "nuevo" | "contactado" | "descartado"
      lead_tipo: "contacto_organizacion" | "propuesta_desafio"
      milestone_status: "pendiente" | "en_progreso" | "entregado" | "aprobado"
      notification_tipo:
        | "postulacion_recibida"
        | "postulacion_aceptada"
        | "postulacion_rechazada"
        | "invitacion_organizacion"
        | "evaluacion_nueva"
        | "hito_por_vencer"
        | "mensaje_nuevo"
        | "proyecto_cancelado"
        | "organizacion_verificada"
        | "organizacion_no_verificada"
        | "postulacion_removida"
        | "proyecto_rechazado"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      application_status: [
        "enviada",
        "aceptada",
        "rechazada",
        "retirada",
        "removida",
      ],
      lead_estado: ["nuevo", "contactado", "descartado"],
      lead_tipo: ["contacto_organizacion", "propuesta_desafio"],
      milestone_status: ["pendiente", "en_progreso", "entregado", "aprobado"],
      notification_tipo: [
        "postulacion_recibida",
        "postulacion_aceptada",
        "postulacion_rechazada",
        "invitacion_organizacion",
        "evaluacion_nueva",
        "hito_por_vencer",
        "mensaje_nuevo",
        "proyecto_cancelado",
        "organizacion_verificada",
        "organizacion_no_verificada",
        "postulacion_removida",
        "proyecto_rechazado",
      ],
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

