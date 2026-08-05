import type { Json } from '@/types/json';

/** スポットにどうやって到達したか。主催者レポートでは manual を区別して出す */
export type SpotVerification = 'photo_gps' | 'checkin' | 'qr' | 'manual';

/** area=都道府県制覇 / spot=指定地点をまわる */
export type ThemeKind = 'area' | 'spot';

export type ThemeStatus = 'draft' | 'published' | 'closed';

export type LegalDocType = 'terms' | 'privacy';

export type LegalDocStatus = 'draft' | 'published' | 'archived';

export type Database = {
  public: {
    Tables: {
      sponsors: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          logo_url: string | null;
          contact_email: string | null;
          note: string | null;
          contract_starts_on: string | null;
          contract_ends_on: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          display_name: string;
          logo_url?: string | null;
          contact_email?: string | null;
          note?: string | null;
          contract_starts_on?: string | null;
          contract_ends_on?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['sponsors']['Insert']>;
        Relationships: [];
      };
      theme_templates: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          emoji: string;
          color: string;
          category: string;
          kind: ThemeKind;
          sponsor_id: string | null;
          is_sponsored: boolean;
          area_label: string | null;
          cover_image_url: string | null;
          reward_text: string | null;
          terms_url: string | null;
          starts_at: string | null;
          ends_at: string | null;
          status: ThemeStatus;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          emoji?: string;
          color?: string;
          category?: string;
          kind?: ThemeKind;
          sponsor_id?: string | null;
          is_sponsored?: boolean;
          area_label?: string | null;
          cover_image_url?: string | null;
          reward_text?: string | null;
          terms_url?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          status?: ThemeStatus;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['theme_templates']['Insert']>;
        Relationships: [];
      };
      theme_spots: {
        Row: {
          id: string;
          template_id: string;
          name: string;
          description: string | null;
          address: string | null;
          prefecture_id: number | null;
          lat: number;
          lng: number;
          radius_m: number;
          order_no: number;
          image_url: string | null;
          external_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          name: string;
          description?: string | null;
          address?: string | null;
          prefecture_id?: number | null;
          lat: number;
          lng: number;
          radius_m?: number;
          order_no?: number;
          image_url?: string | null;
          external_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['theme_spots']['Insert']>;
        Relationships: [];
      };
      legal_documents: {
        Row: {
          id: string;
          doc_type: LegalDocType;
          version: string;
          title: string;
          body: string;
          summary: string | null;
          status: LegalDocStatus;
          requires_reconsent: boolean;
          published_at: string | null;
          effective_on: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          doc_type: LegalDocType;
          version: string;
          title: string;
          body: string;
          summary?: string | null;
          status?: LegalDocStatus;
          requires_reconsent?: boolean;
          published_at?: string | null;
          effective_on?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['legal_documents']['Insert']>;
        Relationships: [];
      };
      app_settings: {
        Row: {
          key: string;
          value: Json;
          label: string;
          description: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          value: Json;
          label: string;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['app_settings']['Insert']>;
        Relationships: [];
      };
      user_consents: {
        Row: {
          id: string;
          user_id: string;
          consent_type: string;
          granted: boolean;
          version: string;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          consent_type: string;
          granted: boolean;
          version: string;
          source?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_consents']['Insert']>;
        Relationships: [];
      };
      conquest_entries: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          trip_id: string | null;
          photo_id: string | null;
          prefecture_id: number | null;
          title: string;
          memo: string | null;
          rating: number | null;
          visited_at: string;
          place_name: string | null;
          lat: number | null;
          lng: number | null;
          source: 'manual' | 'photo_suggestion' | 'ai_auto';
          spot_id: string | null;
          verification: SpotVerification;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          trip_id?: string | null;
          photo_id?: string | null;
          prefecture_id?: number | null;
          title: string;
          memo?: string | null;
          rating?: number | null;
          visited_at?: string;
          place_name?: string | null;
          lat?: number | null;
          lng?: number | null;
          source: 'manual' | 'photo_suggestion' | 'ai_auto';
          spot_id?: string | null;
          verification?: SpotVerification;
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
          template_id: string | null;
          joined_at: string | null;
          completed_at: string | null;
          archived_at: string | null;
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
          template_id?: string | null;
          joined_at?: string | null;
          completed_at?: string | null;
          archived_at?: string | null;
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
      photo_reactions: {
        Row: {
          id: string;
          photo_id: string;
          user_id: string;
          /** like=みんなに見えるいいね / heart=自分だけのお気に入り */
          reaction_type: 'like' | 'heart' | 'wow' | 'seen';
          created_at: string;
        };
        Insert: {
          id?: string;
          photo_id: string;
          user_id: string;
          reaction_type: 'like' | 'heart' | 'wow' | 'seen';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['photo_reactions']['Insert']>;
        Relationships: [];
      };
      photo_comments: {
        Row: {
          id: string;
          photo_id: string;
          user_id: string;
          text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          photo_id: string;
          user_id: string;
          text: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['photo_comments']['Insert']>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          language: string | null;
          country_code: string | null;
          email: string | null;
          stripe_customer_id: string | null;
          plan: string;
          points: number;
          last_login_date: string | null;
          login_streak_days: number;
          residence_prefecture_id: number | null;
          birth_year: number | null;
          stats_consent_at: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          avatar_url?: string | null;
          language?: string | null;
          country_code?: string | null;
          email?: string | null;
          stripe_customer_id?: string | null;
          plan?: string;
          points?: number;
          last_login_date?: string | null;
          login_streak_days?: number;
          residence_prefecture_id?: number | null;
          birth_year?: number | null;
          stats_consent_at?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
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
      is_admin: {
        Args: { p_user_id?: string };
        Returns: boolean;
      };
      redeem_trip_invite: {
        Args: {
          p_token: string;
        };
        Returns: string;
      };
    };
  };
};
