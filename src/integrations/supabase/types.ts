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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      issues: {
        Row: {
          ai_analysis: Json | null
          area: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          pincode: string | null
          status: string
          updated_at: string | null
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          area?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          pincode?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          area?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          pincode?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_profiles: {
        Row: {
          area: string
          created_at: string | null
          garage_address: string | null
          garage_name: string
          garage_photo_url: string | null
          google_maps_link: string | null
          id: string
          id_proof_url: string | null
          id_proof_verified: boolean | null
          name: string
          pincode: string
          rating: number | null
          total_ratings: number | null
          updated_at: string | null
          user_id: string
          years_of_experience: number | null
        }
        Insert: {
          area: string
          created_at?: string | null
          garage_address?: string | null
          garage_name: string
          garage_photo_url?: string | null
          google_maps_link?: string | null
          id?: string
          id_proof_url?: string | null
          id_proof_verified?: boolean | null
          name: string
          pincode: string
          rating?: number | null
          total_ratings?: number | null
          updated_at?: string | null
          user_id: string
          years_of_experience?: number | null
        }
        Update: {
          area?: string
          created_at?: string | null
          garage_address?: string | null
          garage_name?: string
          garage_photo_url?: string | null
          google_maps_link?: string | null
          id?: string
          id_proof_url?: string | null
          id_proof_verified?: boolean | null
          name?: string
          pincode?: string
          rating?: number | null
          total_ratings?: number | null
          updated_at?: string | null
          user_id?: string
          years_of_experience?: number | null
        }
        Relationships: []
      }
      mechanic_responses: {
        Row: {
          availability: string | null
          created_at: string | null
          id: string
          issue_id: string
          mechanic_id: string
          message: string | null
          price_quote: number
          status: string
          user_rating: number | null
        }
        Insert: {
          availability?: string | null
          created_at?: string | null
          id?: string
          issue_id: string
          mechanic_id: string
          message?: string | null
          price_quote: number
          status?: string
          user_rating?: number | null
        }
        Update: {
          availability?: string | null
          created_at?: string | null
          id?: string
          issue_id?: string
          mechanic_id?: string
          message?: string | null
          price_quote?: number
          status?: string
          user_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_responses_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          issue_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          issue_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          issue_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          phone: string
          verified: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at?: string
          id?: string
          phone: string
          verified?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          phone?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      phone_share_consents: {
        Row: {
          created_at: string | null
          granted: boolean | null
          id: string
          issue_id: string
          mechanic_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted?: boolean | null
          id?: string
          issue_id: string
          mechanic_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted?: boolean | null
          id?: string
          issue_id?: string
          mechanic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_share_consents_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          area: string | null
          created_at: string | null
          id: string
          name: string | null
          phone: string
          pincode: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          area?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          phone: string
          pincode?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          area?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          phone?: string
          pincode?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_pins: {
        Row: {
          created_at: string | null
          id: string
          phone: string
          pin: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          phone: string
          pin: string
        }
        Update: {
          created_at?: string | null
          id?: string
          phone?: string
          pin?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_documents: {
        Row: {
          created_at: string | null
          document_type: string
          expiry_date: string | null
          file_url: string
          id: string
          notes: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          expiry_date?: string | null
          file_url: string
          id?: string
          notes?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          expiry_date?: string | null
          file_url?: string
          id?: string
          notes?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string | null
          fuel_type: string | null
          id: string
          transmission: string | null
          user_id: string
          vehicle_brand: string | null
          vehicle_model: string | null
          vehicle_type: string
          vehicle_year: string | null
        }
        Insert: {
          created_at?: string | null
          fuel_type?: string | null
          id?: string
          transmission?: string | null
          user_id: string
          vehicle_brand?: string | null
          vehicle_model?: string | null
          vehicle_type: string
          vehicle_year?: string | null
        }
        Update: {
          created_at?: string | null
          fuel_type?: string | null
          id?: string
          transmission?: string | null
          user_id?: string
          vehicle_brand?: string | null
          vehicle_model?: string | null
          vehicle_type?: string
          vehicle_year?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "mechanic"
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
      app_role: ["user", "mechanic"],
    },
  },
} as const
