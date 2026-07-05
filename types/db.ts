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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      conquest_entries: {
        Row: {
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          memo: string | null
          metadata: Json
          photo_id: string | null
          place_name: string | null
          prefecture_id: number
          project_id: string
          rating: number | null
          source: Database["public"]["Enums"]["conquest_entry_source"]
          title: string
          trip_id: string | null
          user_id: string
          visited_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          memo?: string | null
          metadata?: Json
          photo_id?: string | null
          place_name?: string | null
          prefecture_id: number
          project_id: string
          rating?: number | null
          source?: Database["public"]["Enums"]["conquest_entry_source"]
          title: string
          trip_id?: string | null
          user_id: string
          visited_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          memo?: string | null
          metadata?: Json
          photo_id?: string | null
          place_name?: string | null
          prefecture_id?: number
          project_id?: string
          rating?: number | null
          source?: Database["public"]["Enums"]["conquest_entry_source"]
          title?: string
          trip_id?: string | null
          user_id?: string
          visited_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conquest_entries_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conquest_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "conquest_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conquest_entries_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      conquest_projects: {
        Row: {
          category: string
          color: string
          created_at: string
          description: string | null
          emoji: string
          id: string
          is_public: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      photo_comments: {
        Row: {
          created_at: string
          id: string
          photo_id: string
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_id: string
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_id?: string
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_comments_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_reactions: {
        Row: {
          created_at: string
          id: string
          photo_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_reactions_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          ai_processing_status: Database["public"]["Enums"]["ai_processing_status"]
          ai_tags: string[]
          caption: string | null
          captured_at: string | null
          confidence: number | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          place_name: string | null
          prefecture_id: number | null
          storage_path: string
          suggested_themes: Json
          theme_entry_created: boolean
          thumbnail_path: string | null
          trip_id: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          ai_processing_status?: Database["public"]["Enums"]["ai_processing_status"]
          ai_tags?: string[]
          caption?: string | null
          captured_at?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          place_name?: string | null
          prefecture_id?: number | null
          storage_path: string
          suggested_themes?: Json
          theme_entry_created?: boolean
          thumbnail_path?: string | null
          trip_id: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          ai_processing_status?: Database["public"]["Enums"]["ai_processing_status"]
          ai_tags?: string[]
          caption?: string | null
          captured_at?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          place_name?: string | null
          prefecture_id?: number | null
          storage_path?: string
          suggested_themes?: Json
          theme_entry_created?: boolean
          thumbnail_path?: string | null
          trip_id?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country_code: string | null
          created_at: string
          display_name: string
          email: string | null
          id: string
          language: string | null
          last_login_date: string | null
          plan: string
          points: number
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id: string
          language?: string | null
          last_login_date?: string | null
          plan?: string
          points?: number
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          language?: string | null
          last_login_date?: string | null
          plan?: string
          points?: number
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tourism_events: {
        Row: {
          conquest_entry_id: string | null
          conquest_project_id: string | null
          created_at: string
          event_type: Database["public"]["Enums"]["tourism_event_type"]
          id: string
          lat: number | null
          lng: number | null
          metadata: Json
          photo_id: string | null
          place_name: string | null
          prefecture_id: number | null
          trip_id: string | null
          user_id: string
        }
        Insert: {
          conquest_entry_id?: string | null
          conquest_project_id?: string | null
          created_at?: string
          event_type: Database["public"]["Enums"]["tourism_event_type"]
          id?: string
          lat?: number | null
          lng?: number | null
          metadata?: Json
          photo_id?: string | null
          place_name?: string | null
          prefecture_id?: number | null
          trip_id?: string | null
          user_id: string
        }
        Update: {
          conquest_entry_id?: string | null
          conquest_project_id?: string | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["tourism_event_type"]
          id?: string
          lat?: number | null
          lng?: number | null
          metadata?: Json
          photo_id?: string | null
          place_name?: string | null
          prefecture_id?: number | null
          trip_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trip_invites: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["trip_role"]
          token: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["trip_role"]
          token?: string
          trip_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["trip_role"]
          token?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_invites_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_members: {
        Row: {
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["trip_role"]
          trip_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["trip_role"]
          trip_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["trip_role"]
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          area: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          owner_id: string
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          owner_id: string
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          owner_id?: string
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          consent_type: string
          created_at: string
          granted: boolean
          id: string
          source: string
          user_id: string
          version: string
        }
        Insert: {
          consent_type: string
          created_at?: string
          granted: boolean
          id?: string
          source?: string
          user_id: string
          version: string
        }
        Update: {
          consent_type?: string
          created_at?: string
          granted?: boolean
          id?: string
          source?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
    }
    Views: {
      latest_user_consents: {
        Row: {
          consent_type: string | null
          created_at: string | null
          granted: boolean | null
          source: string | null
          user_id: string | null
          version: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          country_code: string | null
          display_name: string | null
          id: string | null
          language: string | null
        }
        Insert: {
          avatar_url?: string | null
          country_code?: string | null
          display_name?: string | null
          id?: string | null
          language?: string | null
        }
        Update: {
          avatar_url?: string | null
          country_code?: string | null
          display_name?: string | null
          id?: string | null
          language?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_trip_with_owner: {
        Args: {
          p_area?: string
          p_description?: string
          p_ends_at?: string
          p_starts_at?: string
          p_title: string
        }
        Returns: string
      }
      has_trip_role: {
        Args: {
          p_roles: Database["public"]["Enums"]["trip_role"][]
          p_trip_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { p_user_id: string }; Returns: boolean }
      is_trip_member: {
        Args: { p_trip_id: string; p_user_id: string }
        Returns: boolean
      }
      redeem_trip_invite: { Args: { p_token: string }; Returns: string }
      safe_uuid: { Args: { val: string }; Returns: string }
    }
    Enums: {
      ai_processing_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "skipped"
      conquest_entry_source: "manual" | "photo_suggestion" | "ai_auto"
      tourism_event_type:
        | "trip_created"
        | "photo_uploaded"
        | "place_visit_detected"
        | "theme_entry_created"
        | "prefecture_conquered"
        | "ai_analysis_completed"
        | "trip_member_joined"
        | "travel_log_viewed"
        | "photo_commented"
        | "conquest_project_created"
        | "route_completed"
      trip_role: "owner" | "editor" | "viewer"
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
    Enums: {
      ai_processing_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "skipped",
      ],
      conquest_entry_source: ["manual", "photo_suggestion", "ai_auto"],
      tourism_event_type: [
        "trip_created",
        "photo_uploaded",
        "place_visit_detected",
        "theme_entry_created",
        "prefecture_conquered",
        "ai_analysis_completed",
        "trip_member_joined",
        "travel_log_viewed",
        "photo_commented",
        "conquest_project_created",
        "route_completed",
      ],
      trip_role: ["owner", "editor", "viewer"],
    },
  },
} as const
