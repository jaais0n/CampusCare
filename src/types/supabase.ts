import { Database } from '@/types/supabase';

declare global {
  namespace App {
    type Tables = Database['public']['Tables'];
    type TableName = keyof Tables;
  }
}

// Extend the database types
declare module '@supabase/supabase-js' {
  interface Database {
    public: {
      Tables: {
        emergency_alerts: {
          Row: {
            id: string;
            user_id: string;
            user_name: string;
            user_type: string;
            status: 'active' | 'resolved' | 'cancelled';
            location: string | null;
            additional_info: Record<string, unknown> | null;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            user_id: string;
            user_name: string;
            user_type: string;
            status?: 'active' | 'resolved' | 'cancelled';
            location?: string | null;
            additional_info?: Record<string, unknown> | null;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            user_id?: string;
            user_name?: string;
            user_type?: string;
            status?: 'active' | 'resolved' | 'cancelled';
            location?: string | null;
            additional_info?: Record<string, unknown> | null;
            created_at?: string;
            updated_at?: string;
          };
        };
        profiles: {
          Row: {
            id: string;
            user_id: string;
            role: 'student' | 'faculty' | 'admin';
            status: 'active' | 'inactive' | 'suspended';
            full_name: string;
            email: string;
            phone: string | null;
            roll_number: string | null;
            course: string | null;
            department: string | null;
            year_of_study: number | null;
            faculty_id: string | null;
            cabin_number: string | null;
            designation: string | null;
            date_of_birth: string | null;
            address: string | null;
            emergency_contact: string | null;
            medical_conditions: string | null;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            user_id: string;
            role?: 'student' | 'faculty' | 'admin';
            status?: 'active' | 'inactive' | 'suspended';
            full_name: string;
            email: string;
            phone?: string | null;
            roll_number?: string | null;
            course?: string | null;
            department?: string | null;
            year_of_study?: number | null;
            faculty_id?: string | null;
            cabin_number?: string | null;
            designation?: string | null;
            date_of_birth?: string | null;
            address?: string | null;
            emergency_contact?: string | null;
            medical_conditions?: string | null;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            user_id?: string;
            role?: 'student' | 'faculty' | 'admin';
            status?: 'active' | 'inactive' | 'suspended';
            full_name?: string;
            email?: string;
            phone?: string | null;
            roll_number?: string | null;
            course?: string | null;
            department?: string | null;
            year_of_study?: number | null;
            faculty_id?: string | null;
            cabin_number?: string | null;
            designation?: string | null;
            date_of_birth?: string | null;
            address?: string | null;
            emergency_contact?: string | null;
            medical_conditions?: string | null;
            created_at?: string;
            updated_at?: string;
          };
        };
      };
    };
  }
}
