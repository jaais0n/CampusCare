import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to check if a table exists
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.from(tableName).select('id').limit(1);
    if (error) {
      console.warn(`Error checking table '${tableName}' existence:`, error.message);
      return false;
    }
    console.log(`Table '${tableName}' exists:`, data !== null);
    return data !== null;
  } catch (err) {
    console.error(`Exception when checking if table '${tableName}' exists:`, err);
    return false;
  }
}
