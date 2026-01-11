export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accelerators: {
        Row: {
          application_deadline: string | null
          created_date: string | null
          description: string | null
          duration: string | null
          featured: boolean | null
          focus_areas: string[] | null
          id: string
          investment_range: string | null
          is_active: boolean | null
          location: string | null
          logo_url: string | null
          name: string
          program_type: string | null
          stage: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          application_deadline?: string | null
          created_date?: string | null
          description?: string | null
          duration?: string | null
          featured?: boolean | null
          focus_areas?: string[] | null
          id?: string
          investment_range?: string | null
          is_active?: boolean | null
          location?: string | null
          logo_url?: string | null
          name: string
          program_type?: string | null
          stage?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          application_deadline?: string | null
          created_date?: string | null
          description?: string | null
          duration?: string | null
          featured?: boolean | null
          focus_areas?: string[] | null
          id?: string
          investment_range?: string | null
          is_active?: boolean | null
          location?: string | null
          logo_url?: string | null
          name?: string
          program_type?: string | null
          stage?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      assessment_results: {
        Row: {
          created_at: string
          id: string
          results: Json
          saved_at: string | null
          taken_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          results: Json
          saved_at?: string | null
          taken_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          results?: Json
          saved_at?: string | null
          taken_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          resource_description: string | null
          resource_id: string
          resource_name: string | null
          resource_type: string
          resource_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          resource_description?: string | null
          resource_id: string
          resource_name?: string | null
          resource_type: string
          resource_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          resource_description?: string | null
          resource_id?: string
          resource_name?: string | null
          resource_type?: string
          resource_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      communities: {
        Row: {
          category: string | null
          created_date: string | null
          description: string | null
          featured: boolean | null
          id: string
          logo_url: string | null
          member_count: number | null
          name: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          category?: string | null
          created_date?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          logo_url?: string | null
          member_count?: number | null
          name: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          category?: string | null
          created_date?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          logo_url?: string | null
          member_count?: number | null
          name?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      connection_requests: {
        Row: {
          ask_id: string
          created_at: string | null
          expired_notification_sent: boolean | null
          expires_at: string | null
          founder_id: string
          founder_linkedin: string | null
          founder_response: string | null
          id: string
          requester_context: string
          requester_email: string | null
          requester_id: string
          requester_linkedin: string
          requester_name: string | null
          responded_at: string | null
          status: string | null
          updated_at: string | null
          viewed_by_requester: boolean | null
        }
        Insert: {
          ask_id: string
          created_at?: string | null
          expired_notification_sent?: boolean | null
          expires_at?: string | null
          founder_id: string
          founder_linkedin?: string | null
          founder_response?: string | null
          id?: string
          requester_context: string
          requester_email?: string | null
          requester_id: string
          requester_linkedin: string
          requester_name?: string | null
          responded_at?: string | null
          status?: string | null
          updated_at?: string | null
          viewed_by_requester?: boolean | null
        }
        Update: {
          ask_id?: string
          created_at?: string | null
          expired_notification_sent?: boolean | null
          expires_at?: string | null
          founder_id?: string
          founder_linkedin?: string | null
          founder_response?: string | null
          id?: string
          requester_context?: string
          requester_email?: string | null
          requester_id?: string
          requester_linkedin?: string
          requester_name?: string | null
          responded_at?: string | null
          status?: string | null
          updated_at?: string | null
          viewed_by_requester?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "connection_requests_ask_id_fkey"
            columns: ["ask_id"]
            isOneToOne: false
            referencedRelation: "founder_asks"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          status: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_signups: {
        Row: {
          email: string
          id: string
          name: string | null
          source: string | null
          subscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          name?: string | null
          source?: string | null
          subscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          name?: string | null
          source?: string | null
          subscribed_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          address: string | null
          cost: string | null
          created_date: string | null
          date: string | null
          description: string | null
          end_time: string | null
          event_type: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          is_virtual: boolean | null
          location: string | null
          name: string
          organizer: string | null
          registration_link: string | null
          start_time: string | null
          updated_at: string | null
          virtual_link: string | null
        }
        Insert: {
          address?: string | null
          cost?: string | null
          created_date?: string | null
          date?: string | null
          description?: string | null
          end_time?: string | null
          event_type?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          is_virtual?: boolean | null
          location?: string | null
          name: string
          organizer?: string | null
          registration_link?: string | null
          start_time?: string | null
          updated_at?: string | null
          virtual_link?: string | null
        }
        Update: {
          address?: string | null
          cost?: string | null
          created_date?: string | null
          date?: string | null
          description?: string | null
          end_time?: string | null
          event_type?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          is_virtual?: boolean | null
          location?: string | null
          name?: string
          organizer?: string | null
          registration_link?: string | null
          start_time?: string | null
          updated_at?: string | null
          virtual_link?: string | null
        }
        Relationships: []
      }
      founder_asks: {
        Row: {
          allow_amplification: boolean | null
          amount: string | null
          amount_visibility: string | null
          amplification_notified_at: string | null
          amplified_at: string | null
          category: string | null
          company_name: string | null
          compliance_type: string | null
          connection_request_count: number | null
          created_at: string | null
          description: string
          disclaimer_acknowledged: boolean | null
          disclaimer_acknowledged_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_anonymous: boolean | null
          is_verified: boolean | null
          linkedin_url: string | null
          sector: string
          stage: string | null
          target_amount: string | null
          terms_version: string | null
          updated_at: string | null
          user_id: string
          view_count: number | null
          website_url: string | null
        }
        Insert: {
          allow_amplification?: boolean | null
          amount?: string | null
          amount_visibility?: string | null
          amplification_notified_at?: string | null
          amplified_at?: string | null
          category?: string | null
          company_name?: string | null
          compliance_type?: string | null
          connection_request_count?: number | null
          created_at?: string | null
          description: string
          disclaimer_acknowledged?: boolean | null
          disclaimer_acknowledged_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_anonymous?: boolean | null
          is_verified?: boolean | null
          linkedin_url?: string | null
          sector: string
          stage?: string | null
          target_amount?: string | null
          terms_version?: string | null
          updated_at?: string | null
          user_id: string
          view_count?: number | null
          website_url?: string | null
        }
        Update: {
          allow_amplification?: boolean | null
          amount?: string | null
          amount_visibility?: string | null
          amplification_notified_at?: string | null
          amplified_at?: boolean | null
          category?: string | null
          company_name?: string | null
          compliance_type?: string | null
          connection_request_count?: number | null
          created_at?: string | null
          description?: string
          disclaimer_acknowledged?: boolean | null
          disclaimer_acknowledged_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_anonymous?: boolean | null
          is_verified?: boolean | null
          linkedin_url?: string | null
          sector?: string
          stage?: string | null
          target_amount?: string | null
          terms_version?: string | null
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_founder_asks_user_profile"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_founder_asks_user_profile"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles_decrypted"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_news: {
        Row: {
          amount: string | null
          company_name: string | null
          created_date: string | null
          date: string | null
          id: string
          image_url: string | null
          investors: string[] | null
          round_type: string | null
          source_name: string | null
          source_url: string | null
          summary: string | null
          title: string
        }
        Insert: {
          amount?: string | null
          company_name?: string | null
          created_date?: string | null
          date?: string | null
          id?: string
          image_url?: string | null
          investors?: string[] | null
          round_type?: string | null
          source_name?: string | null
          source_url?: string | null
          summary?: string | null
          title: string
        }
        Update: {
          amount?: string | null
          company_name?: string | null
          created_date?: string | null
          date?: string | null
          id?: string
          image_url?: string | null
          investors?: string[] | null
          round_type?: string | null
          source_name?: string | null
          source_url?: string | null
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      funding_opportunities: {
        Row: {
          application_link: string | null
          check_size_max: number | null
          check_size_min: number | null
          chicago_focused: boolean | null
          contact_email: string | null
          created_date: string | null
          deadline: string | null
          description: string | null
          featured: boolean | null
          id: string
          is_active: boolean | null
          name: string
          opportunity_type: string | null
          organization: string | null
          sectors: string[] | null
          stage: string[] | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          application_link?: string | null
          check_size_max?: number | null
          check_size_min?: number | null
          chicago_focused?: boolean | null
          contact_email?: string | null
          created_date?: string | null
          deadline?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          is_active?: boolean | null
          name: string
          opportunity_type?: string | null
          organization?: string | null
          sectors?: string[] | null
          stage?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          application_link?: string | null
          check_size_max?: number | null
          check_size_min?: number | null
          chicago_focused?: boolean | null
          contact_email?: string | null
          created_date?: string | null
          deadline?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          is_active?: boolean | null
          name?: string
          opportunity_type?: string | null
          organization?: string | null
          sectors?: string[] | null
          stage?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      resource_submissions: {
        Row: {
          description: string | null
          email: string | null
          id: string
          name: string | null
          resource_name: string
          resource_type: string | null
          resource_url: string | null
          reviewed_at: string | null
          status: string | null
          submitted_at: string | null
        }
        Insert: {
          description?: string | null
          email?: string | null
          id?: string
          name?: string | null
          resource_name: string
          resource_type?: string | null
          resource_url?: string | null
          reviewed_at?: string | null
          status?: string | null
          submitted_at?: string | null
        }
        Update: {
          description?: string | null
          email?: string | null
          id?: string
          name?: string | null
          resource_name?: string
          resource_type?: string | null
          resource_url?: string | null
          reviewed_at?: string | null
          status?: string | null
          submitted_at?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          company_name: string
          competitive_moat: string | null
          created_date: string | null
          description: string | null
          featured: boolean | null
          founded_year: number | null
          founders: string[] | null
          funding_raised: string | null
          id: string
          is_unicorn: boolean | null
          key_insights: string[] | null
          linkedin: string | null
          logo_url: string | null
          milestones: Json | null
          moat_description: string | null
          sector: string | null
          tagline: string | null
          updated_at: string | null
          valuation: string | null
          website: string | null
        }
        Insert: {
          company_name: string
          competitive_moat?: string | null
          created_date?: string | null
          description?: string | null
          featured?: boolean | null
          founded_year?: number | null
          founders?: string[] | null
          funding_raised?: string | null
          id?: string
          is_unicorn?: boolean | null
          key_insights?: string[] | null
          linkedin?: string | null
          logo_url?: string | null
          milestones?: Json | null
          moat_description?: string | null
          sector?: string | null
          tagline?: string | null
          updated_at?: string | null
          valuation?: string | null
          website?: string | null
        }
        Update: {
          company_name?: string
          competitive_moat?: string | null
          created_date?: string | null
          description?: string | null
          featured?: boolean | null
          founded_year?: number | null
          founders?: string[] | null
          funding_raised?: string | null
          id?: string
          is_unicorn?: boolean | null
          key_insights?: string[] | null
          linkedin?: string | null
          logo_url?: string | null
          milestones?: Json | null
          moat_description?: string | null
          sector?: string | null
          tagline?: string | null
          updated_at?: string | null
          valuation?: string | null
          website?: string | null
        }
        Relationships: []
      }
      upcoming_opportunities: {
        Row: {
          application_link: string | null
          created_date: string | null
          deadline: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          opportunity_type: string | null
          organization: string | null
          prize_amount: string | null
          requirements: string[] | null
          updated_at: string | null
        }
        Insert: {
          application_link?: string | null
          created_date?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          opportunity_type?: string | null
          organization?: string | null
          prize_amount?: string | null
          requirements?: string[] | null
          updated_at?: string | null
        }
        Update: {
          application_link?: string | null
          created_date?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          opportunity_type?: string | null
          organization?: string | null
          prize_amount?: string | null
          requirements?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          achievements: string[] | null
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          created_at: string | null
          current_focus: string | null
          email: string
          first_name: string | null
          focus_description: string | null
          full_name: string | null
          help_offer_email: boolean | null
          help_offer_inapp: boolean | null
          help_response_email: boolean | null
          help_response_inapp: boolean | null
          id: string
          industry_focus: string[] | null
          interests: string[] | null
          last_name: string | null
          linkedin_url: string | null
          location: string | null
          opportunity_category: string | null
          role: string | null
          stage: string | null
          startup_name: string | null
          tech_stack: string[] | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          achievements?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          current_focus?: string | null
          email: string
          first_name?: string | null
          focus_description?: string | null
          full_name?: string | null
          help_offer_email?: boolean | null
          help_offer_inapp?: boolean | null
          help_response_email?: boolean | null
          help_response_inapp?: boolean | null
          id: string
          industry_focus?: string[] | null
          interests?: string[] | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          opportunity_category?: string | null
          role?: string | null
          stage?: string | null
          startup_name?: string | null
          tech_stack?: string[] | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          achievements?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          current_focus?: string | null
          email?: string
          first_name?: string | null
          focus_description?: string | null
          full_name?: string | null
          help_offer_email?: boolean | null
          help_offer_inapp?: boolean | null
          help_response_email?: boolean | null
          help_response_inapp?: boolean | null
          id?: string
          industry_focus?: string[] | null
          interests?: string[] | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          opportunity_category?: string | null
          role?: string | null
          stage?: string | null
          startup_name?: string | null
          tech_stack?: string[] | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          address: string | null
          amenities: string[] | null
          contact_email: string | null
          contact_phone: string | null
          created_date: string | null
          description: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          neighborhood: string | null
          pricing: string | null
          updated_at: string | null
          website: string | null
          workspace_type: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          created_date?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          neighborhood?: string | null
          pricing?: string | null
          updated_at?: string | null
          website?: string | null
          workspace_type?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          created_date?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          neighborhood?: string | null
          pricing?: string | null
          updated_at?: string | null
          website?: string | null
          workspace_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      user_profiles_decrypted: {
        Row: {
          achievements: string[] | null
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          created_at: string | null
          current_focus: string | null
          email: string | null
          first_name: string | null
          focus_description: string | null
          full_name: string | null
          help_offer_email: boolean | null
          help_offer_inapp: boolean | null
          help_response_email: boolean | null
          help_response_inapp: boolean | null
          id: string | null
          industry_focus: string[] | null
          interests: string[] | null
          last_name: string | null
          linkedin_url: string | null
          location: string | null
          opportunity_category: string | null
          role: string | null
          stage: string | null
          startup_name: string | null
          tech_stack: string[] | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          achievements?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          current_focus?: string | null
          email?: string | null
          first_name?: string | null
          focus_description?: string | null
          full_name?: string | null
          help_offer_email?: boolean | null
          help_offer_inapp?: boolean | null
          help_response_email?: boolean | null
          help_response_inapp?: boolean | null
          id?: string | null
          industry_focus?: string[] | null
          interests?: string[] | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          opportunity_category?: string | null
          role?: string | null
          stage?: string | null
          startup_name?: string | null
          tech_stack?: string[] | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          achievements?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          current_focus?: string | null
          email?: string | null
          first_name?: string | null
          focus_description?: string | null
          full_name?: string | null
          help_offer_email?: boolean | null
          help_offer_inapp?: boolean | null
          help_response_email?: boolean | null
          help_response_inapp?: boolean | null
          id?: string | null
          industry_focus?: string[] | null
          interests?: string[] | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          opportunity_category?: string | null
          role?: string | null
          stage?: string | null
          startup_name?: string | null
          tech_stack?: string[] | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_connection_request: {
        Args: { linkedin_url: string; request_uuid: string }
        Returns: boolean
      }
      can_create_ask: { Args: { user_uuid: string }; Returns: boolean }
      days_until_next_ask: { Args: { user_uuid: string }; Returns: number }
      decline_connection_request: {
        Args: { request_uuid: string }
        Returns: boolean
      }
      expire_old_connection_requests: { Args: never; Returns: number }
      get_founder_ask_with_profile: {
        Args: { ask_uuid: string }
        Returns: {
          company_name: string
          connection_request_count: number
          created_at: string
          description: string
          founder_avatar: string
          founder_name: string
          founder_role: string
          id: string
          is_active: boolean
          is_verified: boolean
          linkedin_url: string
          sector: string
          stage: string
          target_amount: string
          view_count: number
        }[]
      }
      increment_ask_view_count: {
        Args: { ask_uuid: string }
        Returns: undefined
      }
      increment_connection_count: {
        Args: { ask_uuid: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
