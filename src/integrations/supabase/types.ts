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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          consultation_notes: string | null
          created_at: string
          doctor_id: string
          follow_up_date: string | null
          id: string
          issue_description: string
          prescription: string | null
          priority: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          symptoms: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          consultation_notes?: string | null
          created_at?: string
          doctor_id: string
          follow_up_date?: string | null
          id?: string
          issue_description: string
          prescription?: string | null
          priority?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          symptoms?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          consultation_notes?: string | null
          created_at?: string
          doctor_id?: string
          follow_up_date?: string | null
          id?: string
          issue_description?: string
          prescription?: string | null
          priority?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          symptoms?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          medicine_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          medicine_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          medicine_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      counseling_bookings: {
        Row: {
          alternative_dates: string[] | null
          alternative_times: string[] | null
          anonymous_contact: string | null
          category: Database["public"]["Enums"]["counseling_category"]
          confirmed_date: string | null
          confirmed_time: string | null
          counselor_id: string
          created_at: string
          id: string
          is_anonymous: boolean | null
          issue_description: string | null
          meeting_link: string | null
          mode: Database["public"]["Enums"]["counseling_mode"]
          preferred_date: string
          preferred_time: string
          session_notes: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          alternative_dates?: string[] | null
          alternative_times?: string[] | null
          anonymous_contact?: string | null
          category: Database["public"]["Enums"]["counseling_category"]
          confirmed_date?: string | null
          confirmed_time?: string | null
          counselor_id: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          issue_description?: string | null
          meeting_link?: string | null
          mode: Database["public"]["Enums"]["counseling_mode"]
          preferred_date: string
          preferred_time: string
          session_notes?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          alternative_dates?: string[] | null
          alternative_times?: string[] | null
          anonymous_contact?: string | null
          category?: Database["public"]["Enums"]["counseling_category"]
          confirmed_date?: string | null
          confirmed_time?: string | null
          counselor_id?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          issue_description?: string | null
          meeting_link?: string | null
          mode?: Database["public"]["Enums"]["counseling_mode"]
          preferred_date?: string
          preferred_time?: string
          session_notes?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counseling_bookings_counselor_id_fkey"
            columns: ["counselor_id"]
            isOneToOne: false
            referencedRelation: "counselors"
            referencedColumns: ["id"]
          },
        ]
      }
      counseling_feedback: {
        Row: {
          booking_id: string
          created_at: string
          feedback_text: string | null
          id: string
          rating: number
          would_recommend: boolean | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          rating: number
          would_recommend?: boolean | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          rating?: number
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "counseling_feedback_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "counseling_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      counselors: {
        Row: {
          available_days: string[] | null
          available_end_time: string | null
          available_modes:
            | Database["public"]["Enums"]["counseling_mode"][]
            | null
          available_start_time: string | null
          created_at: string
          email: string | null
          experience_years: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          phone: string | null
          qualification: string | null
          room_number: string | null
          session_duration: number | null
          specialization: string[] | null
          updated_at: string
        }
        Insert: {
          available_days?: string[] | null
          available_end_time?: string | null
          available_modes?:
            | Database["public"]["Enums"]["counseling_mode"][]
            | null
          available_start_time?: string | null
          created_at?: string
          email?: string | null
          experience_years?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          phone?: string | null
          qualification?: string | null
          room_number?: string | null
          session_duration?: number | null
          specialization?: string[] | null
          updated_at?: string
        }
        Update: {
          available_days?: string[] | null
          available_end_time?: string | null
          available_modes?:
            | Database["public"]["Enums"]["counseling_mode"][]
            | null
          available_start_time?: string | null
          created_at?: string
          email?: string | null
          experience_years?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          phone?: string | null
          qualification?: string | null
          room_number?: string | null
          session_duration?: number | null
          specialization?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      doctors: {
        Row: {
          available_days: string[] | null
          available_end_time: string | null
          available_start_time: string | null
          consultation_fee: number | null
          created_at: string
          email: string | null
          experience_years: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          phone: string | null
          qualification: string | null
          room_number: string | null
          specialization: string
          updated_at: string
        }
        Insert: {
          available_days?: string[] | null
          available_end_time?: string | null
          available_start_time?: string | null
          consultation_fee?: number | null
          created_at?: string
          email?: string | null
          experience_years?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          phone?: string | null
          qualification?: string | null
          room_number?: string | null
          specialization: string
          updated_at?: string
        }
        Update: {
          available_days?: string[] | null
          available_end_time?: string | null
          available_start_time?: string | null
          consultation_fee?: number | null
          created_at?: string
          email?: string | null
          experience_years?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          phone?: string | null
          qualification?: string | null
          room_number?: string | null
          specialization?: string
          updated_at?: string
        }
        Relationships: []
      }
      medicine_orders: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          delivered_at: string | null
          delivery_address: string
          delivery_instructions: string | null
          id: string
          order_number: string
          ordered_at: string
          prescription_image_url: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          delivered_at?: string | null
          delivery_address: string
          delivery_instructions?: string | null
          id?: string
          order_number: string
          ordered_at?: string
          prescription_image_url?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          delivered_at?: string | null
          delivery_address?: string
          delivery_instructions?: string | null
          id?: string
          order_number?: string
          ordered_at?: string
          prescription_image_url?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      medicines: {
        Row: {
          brand: string | null
          category: string
          created_at: string
          description: string | null
          dosage: string | null
          expiry_date: string | null
          generic_name: string | null
          id: string
          image_url: string | null
          manufacturer: string | null
          min_stock_level: number | null
          name: string
          price: number
          requires_prescription: boolean | null
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category: string
          created_at?: string
          description?: string | null
          dosage?: string | null
          expiry_date?: string | null
          generic_name?: string | null
          id?: string
          image_url?: string | null
          manufacturer?: string | null
          min_stock_level?: number | null
          name: string
          price: number
          requires_prescription?: boolean | null
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string
          created_at?: string
          description?: string | null
          dosage?: string | null
          expiry_date?: string | null
          generic_name?: string | null
          id?: string
          image_url?: string | null
          manufacturer?: string | null
          min_stock_level?: number | null
          name?: string
          price?: number
          requires_prescription?: boolean | null
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          medicine_id: string
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          id?: string
          medicine_id: string
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          id?: string
          medicine_id?: string
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "medicine_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          cabin_number: string | null
          course: string | null
          created_at: string
          date_of_birth: string | null
          department: string | null
          designation: string | null
          email: string
          emergency_contact: string | null
          faculty_id: string | null
          full_name: string
          id: string
          medical_conditions: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          roll_number: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_id: string
          year_of_study: number | null
        }
        Insert: {
          address?: string | null
          cabin_number?: string | null
          course?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          designation?: string | null
          email: string
          emergency_contact?: string | null
          faculty_id?: string | null
          full_name: string
          id?: string
          medical_conditions?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          roll_number?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id: string
          year_of_study?: number | null
        }
        Update: {
          address?: string | null
          cabin_number?: string | null
          course?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          designation?: string | null
          email?: string
          emergency_contact?: string | null
          faculty_id?: string | null
          full_name?: string
          id?: string
          medical_conditions?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          roll_number?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: string
          year_of_study?: number | null
        }
        Relationships: []
      }
      program_bookings: {
        Row: {
          created_at: string
          enrollment_date: string
          id: string
          notes: string | null
          payment_status: string | null
          program_id: string
          status: Database["public"]["Enums"]["booking_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          enrollment_date?: string
          id?: string
          notes?: string | null
          payment_status?: string | null
          program_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          enrollment_date?: string
          id?: string
          notes?: string | null
          payment_status?: string | null
          program_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_bookings_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "wellness_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_alerts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          latitude: number | null
          location: string
          longitude: number | null
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          response_team: string | null
          response_time: string | null
          status: Database["public"]["Enums"]["alert_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          location: string
          longitude?: number | null
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          response_team?: string | null
          response_time?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          response_team?: string | null
          response_time?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          user_id?: string
        }
        Relationships: []
      }
      wellness_programs: {
        Row: {
          created_at: string
          current_enrollment: number | null
          description: string | null
          difficulty_level: string | null
          duration_minutes: number
          end_time: string
          equipment_required: string | null
          id: string
          image_url: string | null
          instructor_name: string
          instructor_qualification: string | null
          is_active: boolean | null
          location: string
          max_capacity: number
          name: string
          price: number | null
          schedule_days: string[] | null
          start_time: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_enrollment?: number | null
          description?: string | null
          difficulty_level?: string | null
          duration_minutes: number
          end_time: string
          equipment_required?: string | null
          id?: string
          image_url?: string | null
          instructor_name: string
          instructor_qualification?: string | null
          is_active?: boolean | null
          location: string
          max_capacity: number
          name: string
          price?: number | null
          schedule_days?: string[] | null
          start_time: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_enrollment?: number | null
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number
          end_time?: string
          equipment_required?: string | null
          id?: string
          image_url?: string | null
          instructor_name?: string
          instructor_qualification?: string | null
          is_active?: boolean | null
          location?: string
          max_capacity?: number
          name?: string
          price?: number | null
          schedule_days?: string[] | null
          start_time?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      wheelchair_bookings: {
        Row: {
          admin_notes: string | null
          booking_date: string
          created_at: string
          end_time: string
          id: string
          pickup_location: string | null
          purpose: string
          return_location: string | null
          special_requirements: string | null
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string
          wheelchair_id: string
        }
        Insert: {
          admin_notes?: string | null
          booking_date: string
          created_at?: string
          end_time: string
          id?: string
          pickup_location?: string | null
          purpose: string
          return_location?: string | null
          special_requirements?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id: string
          wheelchair_id: string
        }
        Update: {
          admin_notes?: string | null
          booking_date?: string
          created_at?: string
          end_time?: string
          id?: string
          pickup_location?: string | null
          purpose?: string
          return_location?: string | null
          special_requirements?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id?: string
          wheelchair_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wheelchair_bookings_wheelchair_id_fkey"
            columns: ["wheelchair_id"]
            isOneToOne: false
            referencedRelation: "wheelchairs"
            referencedColumns: ["id"]
          },
        ]
      }
      wheelchair_maintenance: {
        Row: {
          cost: number | null
          created_at: string
          description: string
          id: string
          maintenance_date: string
          maintenance_type: string
          next_maintenance_date: string | null
          performed_by: string
          wheelchair_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          description: string
          id?: string
          maintenance_date: string
          maintenance_type: string
          next_maintenance_date?: string | null
          performed_by: string
          wheelchair_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          description?: string
          id?: string
          maintenance_date?: string
          maintenance_type?: string
          next_maintenance_date?: string | null
          performed_by?: string
          wheelchair_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wheelchair_maintenance_wheelchair_id_fkey"
            columns: ["wheelchair_id"]
            isOneToOne: false
            referencedRelation: "wheelchairs"
            referencedColumns: ["id"]
          },
        ]
      }
      wheelchairs: {
        Row: {
          brand: string | null
          condition: string | null
          created_at: string
          id: string
          last_maintenance: string | null
          location: string
          model: string | null
          notes: string | null
          purchase_date: string | null
          status: string
          updated_at: string
          wheelchair_type: string
        }
        Insert: {
          brand?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          last_maintenance?: string | null
          location: string
          model?: string | null
          notes?: string | null
          purchase_date?: string | null
          status?: string
          updated_at?: string
          wheelchair_type: string
        }
        Update: {
          brand?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          last_maintenance?: string | null
          location?: string
          model?: string | null
          notes?: string | null
          purchase_date?: string | null
          status?: string
          updated_at?: string
          wheelchair_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      alert_status: "active" | "resolved" | "false_alarm"
      appointment_status: "scheduled" | "confirmed" | "completed" | "cancelled"
      booking_status: "pending" | "confirmed" | "completed" | "cancelled"
      counseling_category:
        | "stress"
        | "career"
        | "personal"
        | "academic"
        | "relationships"
        | "other"
      counseling_mode: "in_person" | "online"
      order_status: "pending" | "approved" | "rejected" | "delivered"
      user_role: "student" | "faculty" | "admin"
      user_status: "active" | "inactive" | "suspended"
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
      alert_status: ["active", "resolved", "false_alarm"],
      appointment_status: ["scheduled", "confirmed", "completed", "cancelled"],
      booking_status: ["pending", "confirmed", "completed", "cancelled"],
      counseling_category: [
        "stress",
        "career",
        "personal",
        "academic",
        "relationships",
        "other",
      ],
      counseling_mode: ["in_person", "online"],
      order_status: ["pending", "approved", "rejected", "delivered"],
      user_role: ["student", "faculty", "admin"],
      user_status: ["active", "inactive", "suspended"],
    },
  },
} as const
