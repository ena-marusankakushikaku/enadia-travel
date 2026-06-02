import type { Json } from '@/types/json';

export type Database = {
  public: {
    Tables: {
      conquest_entries: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          trip_id: string | null;
          photo_id: string | null;
          prefecture_id: number;
          title: string;
          memo: string | null;
          rating: number | null;
          visited_at: string;
          place_name: string | null;
          lat: number | null;
          lng: number | null;
          source: 'manual' | 'photo_suggestion' | 'ai_auto';
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          trip_id?: string | null;
          photo_id?: string | null;
          prefecture_id: number;
          title: string;
          memo?: string | null;
          rating?: number | null;
          visited_at?: string;
          place_name?: string | null;
          lat?: number | null;
          lng?: number | null;
          source: 'manual' | 'photo_suggestion' | 'ai_auto';
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['conquest_entries']['Insert']>;
        Relationships: [];
      };
      conquest_projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          emoji: string;
          color: string;
          description: string | null;
          category: string;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          emoji: string;
          color: string;
          description?: string | null;
          category: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['conquest_projects']['Insert']>;
        Relationships: [];
      };
      photos: {
        Row: {
          id: string;
          trip_id: string;
          uploaded_by: string;
          storage_path: string;
          thumbnail_path: string | null;
          lat: number | null;
          lng: number | null;
          place_name: string | null;
          prefecture_id: number | null;
          confidence: number | null;
          ai_tags: string[];
          caption: string | null;
          captured_at: string | null;
          suggested_themes: Json;
          ai_processing_status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
          theme_entry_created: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          uploaded_by: string;
          storage_path: string;
          thumbnail_path?: string | null;
          lat?: number | null;
          lng?: number | null;
          place_name?: string | null;
          prefecture_id?: number | null;
          confidence?: number | null;
          ai_tags?: string[];
          caption?: string | null;
          captured_at?: string | null;
          suggested_themes?: Json;
          ai_processing_status?: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
          theme_entry_created?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['photos']['Insert']>;
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          title: string;
          area: string | null;
          starts_at: string | null;
          ends_at: string | null;
          owner_id: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          area?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          owner_id: string;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['trips']['Insert']>;
        Relationships: [];
      };
      trip_members: {
        Row: {
          id: string;
          trip_id: string;
          user_id: string;
          role: 'owner' | 'editor' | 'viewer';
          joined_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          user_id: string;
          role: 'owner' | 'editor' | 'viewer';
          joined_at?: string;
        };
        Update: Partial<Database['public']['Tables']['trip_members']['Insert']>;
        Relationships: [];
      };
      tourism_events: {
        Row: {
          id: string;
          event_type: string;
          user_id: string;
          trip_id: string | null;
          photo_id: string | null;
          conquest_project_id: string | null;
          conquest_entry_id: string | null;
          prefecture_id: number | null;
          lat: number | null;
          lng: number | null;
          place_name: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['tourism_events']['Row']> & {
          event_type: string;
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['tourism_events']['Insert']>;
        Relationships: [];
      };
    };
    Views: {
      latest_user_consents: {
        Row: {
          user_id: string;
          consent_type: string;
          granted: boolean;
          version: string;
          source: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      public_profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          language: string | null;
          country_code: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: {
      create_trip_with_owner: {
        Args: {
          p_title: string;
          p_area?: string | null;
          p_starts_at?: string | null;
          p_ends_at?: string | null;
          p_description?: string | null;
        };
        Returns: string;
      };
    };
  };
};
