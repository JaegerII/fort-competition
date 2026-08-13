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
      audit_log: {
        Row: {
          action: string
          actor_official_id: string | null
          actor_user_id: string | null
          after: Json | null
          before: Json | null
          competition_id: string | null
          created_at: string
          device_id: string | null
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_official_id?: string | null
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          competition_id?: string | null
          created_at?: string
          device_id?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_official_id?: string | null
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          competition_id?: string | null
          created_at?: string
          device_id?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_official_id_fkey"
            columns: ["actor_official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          code: string
          competition_id: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          competition_id: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          competition_id?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          capacity: number | null
          created_at: string
          currency: string
          description: string | null
          ends_at: string | null
          id: string
          level: string | null
          name: string
          organization_id: string
          range_id: string | null
          registration_closes_at: string | null
          registration_fee: number | null
          registration_opens_at: string | null
          ruleset_version_id: string | null
          slug: string
          starts_at: string | null
          status: Database["public"]["Enums"]["competition_status"]
          timezone: string
          visibility: Database["public"]["Enums"]["competition_visibility"]
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          level?: string | null
          name: string
          organization_id: string
          range_id?: string | null
          registration_closes_at?: string | null
          registration_fee?: number | null
          registration_opens_at?: string | null
          ruleset_version_id?: string | null
          slug: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["competition_status"]
          timezone?: string
          visibility?: Database["public"]["Enums"]["competition_visibility"]
        }
        Update: {
          capacity?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          level?: string | null
          name?: string
          organization_id?: string
          range_id?: string | null
          registration_closes_at?: string | null
          registration_fee?: number | null
          registration_opens_at?: string | null
          ruleset_version_id?: string | null
          slug?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["competition_status"]
          timezone?: string
          visibility?: Database["public"]["Enums"]["competition_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "competitions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitions_range_id_fkey"
            columns: ["range_id"]
            isOneToOne: false
            referencedRelation: "ranges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitions_ruleset_version_id_fkey"
            columns: ["ruleset_version_id"]
            isOneToOne: false
            referencedRelation: "ruleset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          granted: boolean
          granted_at: string
          id: string
          type: Database["public"]["Enums"]["consent_type"]
          user_id: string
          version: string
        }
        Insert: {
          granted?: boolean
          granted_at?: string
          id?: string
          type: Database["public"]["Enums"]["consent_type"]
          user_id: string
          version: string
        }
        Update: {
          granted?: boolean
          granted_at?: string
          id?: string
          type?: Database["public"]["Enums"]["consent_type"]
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          competition_id: string
          created_at: string
          id: string
          label: string
          last_seen_at: string | null
          official_id: string | null
        }
        Insert: {
          competition_id: string
          created_at?: string
          id?: string
          label: string
          last_seen_at?: string | null
          official_id?: string | null
        }
        Update: {
          competition_id?: string
          created_at?: string
          id?: string
          label?: string
          last_seen_at?: string | null
          official_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplines: {
        Row: {
          code: string
          id: string
          name: string
        }
        Insert: {
          code: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      divisions: {
        Row: {
          code: string
          competition_id: string
          config: Json
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          competition_id: string
          config?: Json
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          competition_id?: string
          config?: Json
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "divisions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      gdpr_requests: {
        Row: {
          completed_at: string | null
          id: string
          requested_at: string
          status: Database["public"]["Enums"]["gdpr_request_status"]
          type: Database["public"]["Enums"]["gdpr_request_type"]
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          requested_at?: string
          status?: Database["public"]["Enums"]["gdpr_request_status"]
          type: Database["public"]["Enums"]["gdpr_request_type"]
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          requested_at?: string
          status?: Database["public"]["Enums"]["gdpr_request_status"]
          type?: Database["public"]["Enums"]["gdpr_request_type"]
          user_id?: string
        }
        Relationships: []
      }
      officials: {
        Row: {
          competition_id: string
          created_at: string
          device_scoped_code_hash: string | null
          display_name: string
          id: string
          role: Database["public"]["Enums"]["official_role"]
          squad_scope: string[] | null
          user_id: string | null
        }
        Insert: {
          competition_id: string
          created_at?: string
          device_scoped_code_hash?: string | null
          display_name: string
          id?: string
          role: Database["public"]["Enums"]["official_role"]
          squad_scope?: string[] | null
          user_id?: string | null
        }
        Update: {
          competition_id?: string
          created_at?: string
          device_scoped_code_hash?: string | null
          display_name?: string
          id?: string
          role?: Database["public"]["Enums"]["official_role"]
          squad_scope?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "officials_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          country: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          provider: string
          provider_ref: string | null
          registration_id: string
          status: Database["public"]["Enums"]["payment_status"]
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          provider_ref?: string | null
          registration_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          provider_ref?: string | null
          registration_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      penalties: {
        Row: {
          id: string
          penalty_type: string
          quantity: number
          score_event_id: string
          value: number
        }
        Insert: {
          id?: string
          penalty_type: string
          quantity?: number
          score_event_id: string
          value: number
        }
        Update: {
          id?: string
          penalty_type?: string
          quantity?: number
          score_event_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "penalties_score_event_id_fkey"
            columns: ["score_event_id"]
            isOneToOne: false
            referencedRelation: "score_events"
            referencedColumns: ["id"]
          },
        ]
      }
      ranges: {
        Row: {
          address: string | null
          bays: number | null
          created_at: string
          facilities: Json
          gps_lat: number | null
          gps_lng: number | null
          id: string
          name: string
          organization_id: string
          timezone: string
        }
        Insert: {
          address?: string | null
          bays?: number | null
          created_at?: string
          facilities?: Json
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          name: string
          organization_id: string
          timezone?: string
        }
        Update: {
          address?: string | null
          bays?: number | null
          created_at?: string
          facilities?: Json
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          name?: string
          organization_id?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "ranges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_categories: {
        Row: {
          category_id: string
          registration_id: string
        }
        Insert: {
          category_id: string
          registration_id: string
        }
        Update: {
          category_id?: string
          registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_categories_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          competition_id: string
          division_id: string | null
          id: string
          registered_at: string
          shooter_id: string
          status: Database["public"]["Enums"]["registration_status"]
          waitlist_position: number | null
        }
        Insert: {
          competition_id: string
          division_id?: string | null
          id?: string
          registered_at?: string
          shooter_id: string
          status?: Database["public"]["Enums"]["registration_status"]
          waitlist_position?: number | null
        }
        Update: {
          competition_id?: string
          division_id?: string | null
          id?: string
          registered_at?: string
          shooter_id?: string
          status?: Database["public"]["Enums"]["registration_status"]
          waitlist_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_shooter_id_fkey"
            columns: ["shooter_id"]
            isOneToOne: false
            referencedRelation: "shooters"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          calculated_at: string
          competition_id: string
          hit_factor: number | null
          id: string
          needs_review: boolean
          percentage: number | null
          points: number | null
          rank: number | null
          registration_id: string
          ruleset_version_id: string | null
          scope: Database["public"]["Enums"]["result_scope"]
          scope_ref_id: string | null
        }
        Insert: {
          calculated_at?: string
          competition_id: string
          hit_factor?: number | null
          id?: string
          needs_review?: boolean
          percentage?: number | null
          points?: number | null
          rank?: number | null
          registration_id: string
          ruleset_version_id?: string | null
          scope: Database["public"]["Enums"]["result_scope"]
          scope_ref_id?: string | null
        }
        Update: {
          calculated_at?: string
          competition_id?: string
          hit_factor?: number | null
          id?: string
          needs_review?: boolean
          percentage?: number | null
          points?: number | null
          rank?: number | null
          registration_id?: string
          ruleset_version_id?: string | null
          scope?: Database["public"]["Enums"]["result_scope"]
          scope_ref_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "results_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_ruleset_version_id_fkey"
            columns: ["ruleset_version_id"]
            isOneToOne: false
            referencedRelation: "ruleset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      ruleset_versions: {
        Row: {
          created_at: string
          definition: Json
          id: string
          published_at: string | null
          ruleset_id: string
          status: Database["public"]["Enums"]["ruleset_version_status"]
          version: string
        }
        Insert: {
          created_at?: string
          definition?: Json
          id?: string
          published_at?: string | null
          ruleset_id: string
          status?: Database["public"]["Enums"]["ruleset_version_status"]
          version: string
        }
        Update: {
          created_at?: string
          definition?: Json
          id?: string
          published_at?: string | null
          ruleset_id?: string
          status?: Database["public"]["Enums"]["ruleset_version_status"]
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "ruleset_versions_ruleset_id_fkey"
            columns: ["ruleset_id"]
            isOneToOne: false
            referencedRelation: "rulesets"
            referencedColumns: ["id"]
          },
        ]
      }
      rulesets: {
        Row: {
          created_at: string
          discipline_id: string
          id: string
          name: string
          organization_id: string | null
          scoring_type: Database["public"]["Enums"]["ruleset_scoring_type"]
        }
        Insert: {
          created_at?: string
          discipline_id: string
          id?: string
          name: string
          organization_id?: string | null
          scoring_type: Database["public"]["Enums"]["ruleset_scoring_type"]
        }
        Update: {
          created_at?: string
          discipline_id?: string
          id?: string
          name?: string
          organization_id?: string | null
          scoring_type?: Database["public"]["Enums"]["ruleset_scoring_type"]
        }
        Relationships: [
          {
            foreignKeyName: "rulesets_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rulesets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      score_confirmations: {
        Row: {
          confirmed_at: string
          confirmed_by_registration_id: string | null
          id: string
          method: Database["public"]["Enums"]["score_confirmation_method"]
          score_event_id: string
          signature_data: string | null
        }
        Insert: {
          confirmed_at?: string
          confirmed_by_registration_id?: string | null
          id?: string
          method: Database["public"]["Enums"]["score_confirmation_method"]
          score_event_id: string
          signature_data?: string | null
        }
        Update: {
          confirmed_at?: string
          confirmed_by_registration_id?: string | null
          id?: string
          method?: Database["public"]["Enums"]["score_confirmation_method"]
          score_event_id?: string
          signature_data?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "score_confirmations_confirmed_by_registration_id_fkey"
            columns: ["confirmed_by_registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_confirmations_score_event_id_fkey"
            columns: ["score_event_id"]
            isOneToOne: false
            referencedRelation: "score_events"
            referencedColumns: ["id"]
          },
        ]
      }
      score_events: {
        Row: {
          client_created_at: string
          competition_id: string
          corrects_event_id: string | null
          device_id: string | null
          event_type: Database["public"]["Enums"]["score_event_type"]
          id: string
          official_id: string | null
          payload: Json
          registration_id: string
          sequence: number
          server_received_at: string
          stage_id: string
        }
        Insert: {
          client_created_at: string
          competition_id: string
          corrects_event_id?: string | null
          device_id?: string | null
          event_type: Database["public"]["Enums"]["score_event_type"]
          id: string
          official_id?: string | null
          payload?: Json
          registration_id: string
          sequence?: number
          server_received_at?: string
          stage_id: string
        }
        Update: {
          client_created_at?: string
          competition_id?: string
          corrects_event_id?: string | null
          device_id?: string | null
          event_type?: Database["public"]["Enums"]["score_event_type"]
          id?: string
          official_id?: string | null
          payload?: Json
          registration_id?: string
          sequence?: number
          server_received_at?: string
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "score_events_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_events_corrects_event_id_fkey"
            columns: ["corrects_event_id"]
            isOneToOne: false
            referencedRelation: "score_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_events_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_events_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_events_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      shooter_stats: {
        Row: {
          a_zone_pct: number | null
          avg_hit_factor: number | null
          avg_match_pct: number | null
          avg_stage_pct: number | null
          calculated_at: string
          dnf_rate: number | null
          matches_count: number
          penalty_rate: number | null
          podiums_count: number
          shooter_id: string
          stages_count: number
          wins_count: number
        }
        Insert: {
          a_zone_pct?: number | null
          avg_hit_factor?: number | null
          avg_match_pct?: number | null
          avg_stage_pct?: number | null
          calculated_at?: string
          dnf_rate?: number | null
          matches_count?: number
          penalty_rate?: number | null
          podiums_count?: number
          shooter_id: string
          stages_count?: number
          wins_count?: number
        }
        Update: {
          a_zone_pct?: number | null
          avg_hit_factor?: number | null
          avg_match_pct?: number | null
          avg_stage_pct?: number | null
          calculated_at?: string
          dnf_rate?: number | null
          matches_count?: number
          penalty_rate?: number | null
          podiums_count?: number
          shooter_id?: string
          stages_count?: number
          wins_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "shooter_stats_shooter_id_fkey"
            columns: ["shooter_id"]
            isOneToOne: true
            referencedRelation: "shooters"
            referencedColumns: ["id"]
          },
        ]
      }
      shooters: {
        Row: {
          avatar_url: string | null
          claimed_at: string | null
          country: string | null
          created_at: string
          created_by_organization_id: string | null
          display_name: string
          id: string
          locale: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          claimed_at?: string | null
          country?: string | null
          created_at?: string
          created_by_organization_id?: string | null
          display_name: string
          id?: string
          locale?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          claimed_at?: string | null
          country?: string | null
          created_at?: string
          created_by_organization_id?: string | null
          display_name?: string
          id?: string
          locale?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shooters_created_by_organization_id_fkey"
            columns: ["created_by_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_members: {
        Row: {
          id: string
          joined_at: string
          registration_id: string
          squad_id: string
          status: Database["public"]["Enums"]["squad_member_status"]
        }
        Insert: {
          id?: string
          joined_at?: string
          registration_id: string
          squad_id: string
          status?: Database["public"]["Enums"]["squad_member_status"]
        }
        Update: {
          id?: string
          joined_at?: string
          registration_id?: string
          squad_id?: string
          status?: Database["public"]["Enums"]["squad_member_status"]
        }
        Relationships: [
          {
            foreignKeyName: "squad_members_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_members_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          capacity: number
          competition_id: string
          id: string
          name: string
          range_bay: string | null
          scheduled_start: string | null
          sort_order: number
        }
        Insert: {
          capacity: number
          competition_id: string
          id?: string
          name: string
          range_bay?: string | null
          scheduled_start?: string | null
          sort_order?: number
        }
        Update: {
          capacity?: number
          competition_id?: string
          id?: string
          name?: string
          range_bay?: string | null
          scheduled_start?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "squads_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      stages: {
        Row: {
          competition_id: string
          created_at: string
          description: string | null
          id: string
          max_points: number | null
          name: string
          number: number
          par_time: number | null
          published: boolean
        }
        Insert: {
          competition_id: string
          created_at?: string
          description?: string | null
          id?: string
          max_points?: number | null
          name: string
          number: number
          par_time?: number | null
          published?: boolean
        }
        Update: {
          competition_id?: string
          created_at?: string
          description?: string | null
          id?: string
          max_points?: number | null
          name?: string
          number?: number
          par_time?: number | null
          published?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "stages_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_events: {
        Row: {
          batch_id: string
          device_id: string
          event_count: number
          id: string
          received_at: string
          status: Database["public"]["Enums"]["sync_status"]
        }
        Insert: {
          batch_id: string
          device_id: string
          event_count?: number
          id?: string
          received_at?: string
          status?: Database["public"]["Enums"]["sync_status"]
        }
        Update: {
          batch_id?: string
          device_id?: string
          event_count?: number
          id?: string
          received_at?: string
          status?: Database["public"]["Enums"]["sync_status"]
        }
        Relationships: [
          {
            foreignKeyName: "sync_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      target_definitions: {
        Row: {
          id: string
          label: string
          required_hits: number
          sort_order: number
          stage_id: string
          target_type_id: string
        }
        Insert: {
          id?: string
          label: string
          required_hits?: number
          sort_order?: number
          stage_id: string
          target_type_id: string
        }
        Update: {
          id?: string
          label?: string
          required_hits?: number
          sort_order?: number
          stage_id?: string
          target_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "target_definitions_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "target_definitions_target_type_id_fkey"
            columns: ["target_type_id"]
            isOneToOne: false
            referencedRelation: "target_types"
            referencedColumns: ["id"]
          },
        ]
      }
      target_types: {
        Row: {
          code: string
          id: string
          name: string
          zones: Json
        }
        Insert: {
          code: string
          id?: string
          name: string
          zones: Json
        }
        Update: {
          code?: string
          id?: string
          name?: string
          zones?: Json
        }
        Relationships: []
      }
      waitlist_promotions: {
        Row: {
          competition_id: string
          from_status: Database["public"]["Enums"]["registration_status"]
          id: string
          promoted_at: string
          registration_id: string
          to_status: Database["public"]["Enums"]["registration_status"]
          triggered_by: Database["public"]["Enums"]["waitlist_trigger"]
        }
        Insert: {
          competition_id: string
          from_status: Database["public"]["Enums"]["registration_status"]
          id?: string
          promoted_at?: string
          registration_id: string
          to_status: Database["public"]["Enums"]["registration_status"]
          triggered_by: Database["public"]["Enums"]["waitlist_trigger"]
        }
        Update: {
          competition_id?: string
          from_status?: Database["public"]["Enums"]["registration_status"]
          id?: string
          promoted_at?: string
          registration_id?: string
          to_status?: Database["public"]["Enums"]["registration_status"]
          triggered_by?: Database["public"]["Enums"]["waitlist_trigger"]
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_promotions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_promotions_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_official_role: {
        Args: { target_competition: string }
        Returns: Database["public"]["Enums"]["official_role"]
      }
      auth_org_role: {
        Args: { target_org: string }
        Returns: Database["public"]["Enums"]["organization_role"]
      }
      auth_shooter_id: { Args: never; Returns: string }
      can_manage_competition: {
        Args: { target_competition: string }
        Returns: boolean
      }
      is_competition_public: {
        Args: { target_competition: string }
        Returns: boolean
      }
      is_competition_staff: {
        Args: { target_competition: string }
        Returns: boolean
      }
      is_org_admin: { Args: { target_org: string }; Returns: boolean }
    }
    Enums: {
      competition_status:
        | "draft"
        | "published"
        | "registration_open"
        | "registration_closed"
        | "in_progress"
        | "completed"
        | "archived"
      competition_visibility: "public" | "unlisted" | "private"
      consent_type: "terms" | "privacy" | "marketing"
      gdpr_request_status: "pending" | "processing" | "completed" | "rejected"
      gdpr_request_type: "export" | "delete"
      official_role:
        | "match_director"
        | "range_master"
        | "cro"
        | "ro"
        | "scorekeeper"
        | "stats_officer"
        | "admin"
      organization_role: "owner" | "admin" | "member"
      payment_status: "pending" | "succeeded" | "failed" | "refunded"
      registration_status:
        | "pending_payment"
        | "pending_approval"
        | "waitlisted"
        | "confirmed"
        | "withdrawn"
        | "no_show"
      result_scope: "overall" | "division" | "category" | "stage" | "squad"
      ruleset_scoring_type:
        | "hit_factor"
        | "time_plus"
        | "points_only"
        | "custom"
      ruleset_version_status: "draft" | "published" | "deprecated"
      score_confirmation_method: "pin" | "signature" | "qr" | "button"
      score_event_type:
        | "score_entered"
        | "score_corrected"
        | "score_confirmed"
        | "score_flagged"
      squad_member_status: "confirmed" | "waitlisted"
      sync_status: "uploaded" | "processed" | "conflict"
      waitlist_trigger: "withdrawal" | "manual" | "capacity_increase"
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
      competition_status: [
        "draft",
        "published",
        "registration_open",
        "registration_closed",
        "in_progress",
        "completed",
        "archived",
      ],
      competition_visibility: ["public", "unlisted", "private"],
      consent_type: ["terms", "privacy", "marketing"],
      gdpr_request_status: ["pending", "processing", "completed", "rejected"],
      gdpr_request_type: ["export", "delete"],
      official_role: [
        "match_director",
        "range_master",
        "cro",
        "ro",
        "scorekeeper",
        "stats_officer",
        "admin",
      ],
      organization_role: ["owner", "admin", "member"],
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      registration_status: [
        "pending_payment",
        "pending_approval",
        "waitlisted",
        "confirmed",
        "withdrawn",
        "no_show",
      ],
      result_scope: ["overall", "division", "category", "stage", "squad"],
      ruleset_scoring_type: [
        "hit_factor",
        "time_plus",
        "points_only",
        "custom",
      ],
      ruleset_version_status: ["draft", "published", "deprecated"],
      score_confirmation_method: ["pin", "signature", "qr", "button"],
      score_event_type: [
        "score_entered",
        "score_corrected",
        "score_confirmed",
        "score_flagged",
      ],
      squad_member_status: ["confirmed", "waitlisted"],
      sync_status: ["uploaded", "processed", "conflict"],
      waitlist_trigger: ["withdrawal", "manual", "capacity_increase"],
    },
  },
} as const

