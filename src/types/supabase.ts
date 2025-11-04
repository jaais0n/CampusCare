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
      };
    };
  }
}
