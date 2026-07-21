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
      competitive_scans: {
        Row: {
          competitors: string[]
          created_at: string
          id: string
          owner_id: string
          payload: Json
          project_id: string
        }
        Insert: {
          competitors?: string[]
          created_at?: string
          id?: string
          owner_id: string
          payload?: Json
          project_id: string
        }
        Update: {
          competitors?: string[]
          created_at?: string
          id?: string
          owner_id?: string
          payload?: Json
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitive_scans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          confidence: number | null
          created_at: string
          description: string | null
          document_id: string | null
          id: string
          kind: Database["public"]["Enums"]["insight_kind"]
          owner_id: string
          project_id: string
          quote_text: string | null
          sentiment: string | null
          speaker: string | null
          status: Database["public"]["Enums"]["insight_status"]
          title: string
          updated_at: string
          user_edited: boolean
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          description?: string | null
          document_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["insight_kind"]
          owner_id: string
          project_id: string
          quote_text?: string | null
          sentiment?: string | null
          speaker?: string | null
          status?: Database["public"]["Enums"]["insight_status"]
          title: string
          updated_at?: string
          user_edited?: boolean
        }
        Update: {
          confidence?: number | null
          created_at?: string
          description?: string | null
          document_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["insight_kind"]
          owner_id?: string
          project_id?: string
          quote_text?: string | null
          sentiment?: string | null
          speaker?: string | null
          status?: Database["public"]["Enums"]["insight_status"]
          title?: string
          updated_at?: string
          user_edited?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "insights_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "research_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          confidence: number | null
          created_at: string
          effort: number | null
          id: string
          impact: number | null
          moscow: string | null
          owner_id: string
          problem: string | null
          project_id: string
          reach: number | null
          source_insight_ids: string[]
          status: string
          target_user: string | null
          title: string
          updated_at: string
          value_prop: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          effort?: number | null
          id?: string
          impact?: number | null
          moscow?: string | null
          owner_id: string
          problem?: string | null
          project_id: string
          reach?: number | null
          source_insight_ids?: string[]
          status?: string
          target_user?: string | null
          title: string
          updated_at?: string
          value_prop?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          effort?: number | null
          id?: string
          impact?: number | null
          moscow?: string | null
          owner_id?: string
          problem?: string | null
          project_id?: string
          reach?: number | null
          source_insight_ids?: string[]
          status?: string
          target_user?: string | null
          title?: string
          updated_at?: string
          value_prop?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      prds: {
        Row: {
          created_at: string
          id: string
          opportunity_id: string | null
          owner_id: string
          project_id: string
          sections: Json
          status: Database["public"]["Enums"]["prd_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          opportunity_id?: string | null
          owner_id: string
          project_id: string
          sections?: Json
          status?: Database["public"]["Enums"]["prd_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          opportunity_id?: string | null
          owner_id?: string
          project_id?: string
          sections?: Json
          status?: Database["public"]["Enums"]["prd_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prds_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prds_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          industry: string | null
          name: string
          owner_id: string
          target_users: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          name: string
          owner_id: string
          target_users?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          name?: string
          owner_id?: string
          target_users?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      research_documents: {
        Row: {
          created_at: string
          error_message: string | null
          extracted_text: string | null
          file_name: string
          id: string
          mime_type: string | null
          owner_id: string
          project_id: string
          size_bytes: number | null
          status: Database["public"]["Enums"]["doc_status"]
          storage_path: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          extracted_text?: string | null
          file_name: string
          id?: string
          mime_type?: string | null
          owner_id: string
          project_id: string
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["doc_status"]
          storage_path: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          extracted_text?: string | null
          file_name?: string
          id?: string
          mime_type?: string | null
          owner_id?: string
          project_id?: string
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["doc_status"]
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      doc_status: "uploaded" | "processing" | "processed" | "failed"
      insight_kind: "pain_point" | "user_goal" | "feature_request" | "quote"
      insight_status: "pending" | "approved" | "rejected"
      prd_status: "draft" | "in_review" | "approved"
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
      doc_status: ["uploaded", "processing", "processed", "failed"],
      insight_kind: ["pain_point", "user_goal", "feature_request", "quote"],
      insight_status: ["pending", "approved", "rejected"],
      prd_status: ["draft", "in_review", "approved"],
    },
  },
} as const
