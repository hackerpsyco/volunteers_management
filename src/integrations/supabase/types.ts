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
      curriculum: {
        Row: {
          id: string
          content_category: string
          module_no: number | null
          module_name: string | null
          topics_covered: string
          videos: string | null
          quiz_content_ppt: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content_category: string
          module_no?: number | null
          module_name?: string | null
          topics_covered: string
          videos?: string | null
          quiz_content_ppt?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content_category?: string
          module_no?: number | null
          module_name?: string | null
          topics_covered?: string
          videos?: string | null
          quiz_content_ppt?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      facilitators: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          location: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          location?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          location?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      centres: {
        Row: {
          id: string
          name: string
          location: string
          address: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          address?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          address?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      centre_time_slots: {
        Row: {
          id: string
          centre_id: string
          day: string
          start_time: string
          end_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          centre_id: string
          day: string
          start_time: string
          end_time: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          centre_id?: string
          day?: string
          start_time?: string
          end_time?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "centre_time_slots_centre_id_fkey"
            columns: ["centre_id"]
            isOneToOne: false
            referencedRelation: "centres"
            referencedColumns: ["id"]
          }
        ]
      }
      sessions: {
        Row: {
          id: string
          title: string
          session_date: string
          session_time: string
          session_type: string
          status: string
          content_category: string | null
          module_name: string | null
          topics_covered: string | null
          videos: string | null
          quiz_content_ppt: string | null
          facilitator_name: string | null
          volunteer_name: string | null
          coordinator_id: string | null
          meeting_link: string | null
          centre_id: string | null
          centre_time_slot_id: string | null
          session_objective: string | null
          practical_activities: string | null
          session_highlights: string | null
          learning_outcomes: string | null
          facilitator_reflection: string | null
          best_performer: string | null
          guest_teacher_feedback: string | null
          incharge_reviewer_feedback: string | null
          mic_sound_rating: number | null
          seating_view_rating: number | null
          session_strength: number | null
          class_batch: string | null
          guest_teacher_id: string | null
          recorded_at: string | null
          recorded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          session_date: string
          session_time: string
          session_type?: string
          status?: string
          content_category?: string | null
          module_name?: string | null
          topics_covered?: string | null
          videos?: string | null
          quiz_content_ppt?: string | null
          facilitator_name?: string | null
          volunteer_name?: string | null
          coordinator_id?: string | null
          meeting_link?: string | null
          centre_id?: string | null
          centre_time_slot_id?: string | null
          session_objective?: string | null
          practical_activities?: string | null
          session_highlights?: string | null
          learning_outcomes?: string | null
          facilitator_reflection?: string | null
          best_performer?: string | null
          guest_teacher_feedback?: string | null
          incharge_reviewer_feedback?: string | null
          mic_sound_rating?: number | null
          seating_view_rating?: number | null
          session_strength?: number | null
          class_batch?: string | null
          guest_teacher_id?: string | null
          recorded_at?: string | null
          recorded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          session_date?: string
          session_time?: string
          session_type?: string
          status?: string
          content_category?: string | null
          module_name?: string | null
          topics_covered?: string | null
          videos?: string | null
          quiz_content_ppt?: string | null
          facilitator_name?: string | null
          volunteer_name?: string | null
          coordinator_id?: string | null
          meeting_link?: string | null
          centre_id?: string | null
          centre_time_slot_id?: string | null
          session_objective?: string | null
          practical_activities?: string | null
          session_highlights?: string | null
          learning_outcomes?: string | null
          facilitator_reflection?: string | null
          best_performer?: string | null
          guest_teacher_feedback?: string | null
          incharge_reviewer_feedback?: string | null
          mic_sound_rating?: number | null
          seating_view_rating?: number | null
          session_strength?: number | null
          class_batch?: string | null
          guest_teacher_id?: string | null
          recorded_at?: string | null
          recorded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      volunteers: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          is_active: boolean
          linkedin_profile: string | null
          name: string
          organization_name: string | null
          organization_type: string
          personal_email: string | null
          phone_number: string
          updated_at: string
          work_email: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          linkedin_profile?: string | null
          name: string
          organization_name?: string | null
          organization_type?: string
          personal_email?: string | null
          phone_number: string
          updated_at?: string
          work_email: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          linkedin_profile?: string | null
          name?: string
          organization_name?: string | null
          organization_type?: string
          personal_email?: string | null
          phone_number?: string
          updated_at?: string
          work_email?: string
        }
        Relationships: []
      }
      coordinators: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          location: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          location?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          location?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_performance: {
        Row: {
          id: string
          session_id: string
          student_name: string
          questions_asked: number
          performance_rating: number
          performance_comment: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          student_name: string
          questions_asked?: number
          performance_rating: number
          performance_comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          student_name?: string
          questions_asked?: number
          performance_rating?: number
          performance_comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_performance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
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
