export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          wca_id: string | null;
          wca_data: Json | null;
          wca_last_fetched: string | null;
          method: "cfop" | "roux" | "beginner" | "unknown" | null;
          current_average: string | null;
          primary_goal: string | null;
          knows_how_to_solve: boolean;
          onboarding_complete: boolean;
          tier: "free" | "premium" | "lifetime";
          stripe_customer_id: string | null;
          xp: number;
          level: number;
          completed_lessons: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          wca_id?: string | null;
          wca_data?: Json | null;
          wca_last_fetched?: string | null;
          method?: "cfop" | "roux" | "beginner" | "unknown" | null;
          current_average?: string | null;
          primary_goal?: string | null;
          knows_how_to_solve?: boolean;
          onboarding_complete?: boolean;
          tier?: "free" | "premium" | "lifetime";
          stripe_customer_id?: string | null;
          xp?: number;
          level?: number;
          completed_lessons?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          wca_id?: string | null;
          wca_data?: Json | null;
          wca_last_fetched?: string | null;
          method?: "cfop" | "roux" | "beginner" | "unknown" | null;
          current_average?: string | null;
          primary_goal?: string | null;
          knows_how_to_solve?: boolean;
          onboarding_complete?: boolean;
          tier?: "free" | "premium" | "lifetime";
          stripe_customer_id?: string | null;
          xp?: number;
          level?: number;
          completed_lessons?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      solve_sessions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "solve_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      solves: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          time_ms: number;
          penalty: "dnf" | "+2" | null;
          scramble: string | null;
          method: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          time_ms: number;
          penalty?: "dnf" | "+2" | null;
          scramble?: string | null;
          method?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          time_ms?: number;
          penalty?: "dnf" | "+2" | null;
          scramble?: string | null;
          method?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "solves_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "solves_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "solve_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      analyses: {
        Row: {
          id: string;
          user_id: string;
          video_path: string | null;
          method: "cfop" | "roux" | null;
          status: "pending" | "processing" | "complete" | "failed";
          report: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_path?: string | null;
          method?: "cfop" | "roux" | null;
          status?: "pending" | "processing" | "complete" | "failed";
          report?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_path?: string | null;
          method?: "cfop" | "roux" | null;
          status?: "pending" | "processing" | "complete" | "failed";
          report?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "analyses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      analysis_chats: {
        Row: {
          id: string;
          analysis_id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          analysis_id?: string;
          user_id?: string;
          role?: "user" | "assistant";
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "analysis_chats_analysis_id_fkey";
            columns: ["analysis_id"];
            isOneToOne: false;
            referencedRelation: "analyses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analysis_chats_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          video_url: string;
          title: string;
          source: string | null;
          topic_tag: string | null;
          method_tag: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_url: string;
          title: string;
          source?: string | null;
          topic_tag?: string | null;
          method_tag?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_url?: string;
          title?: string;
          source?: string | null;
          topic_tag?: string | null;
          method_tag?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookmarks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_scrambles: {
        Row: {
          id: string;
          user_id: string;
          scramble: string;
          puzzle: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          scramble: string;
          puzzle?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          scramble?: string;
          puzzle?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_scrambles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      badges: {
        Row: {
          id: string;
          user_id: string;
          badge_key: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_key: string;
          earned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_key?: string;
          earned_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "badges_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      xp_events: {
        Row: {
          id: string;
          user_id: string;
          source: string;
          xp_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source: string;
          xp_amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source?: string;
          xp_amount?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "xp_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

// Convenience row types
export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type SolveSession =
  Database["public"]["Tables"]["solve_sessions"]["Row"];
export type Solve = Database["public"]["Tables"]["solves"]["Row"];
export type Analysis = Database["public"]["Tables"]["analyses"]["Row"];
export type AnalysisChat =
  Database["public"]["Tables"]["analysis_chats"]["Row"];
export type Bookmark = Database["public"]["Tables"]["bookmarks"]["Row"];
export type SavedScramble =
  Database["public"]["Tables"]["saved_scrambles"]["Row"];
export type Badge = Database["public"]["Tables"]["badges"]["Row"];
export type XpEvent = Database["public"]["Tables"]["xp_events"]["Row"];
