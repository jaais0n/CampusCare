import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-client-info': 'campuscareplus-mobile'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

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

// Optimized query helper with caching
export const cachedQuery = async <T>(
  key: string,
  queryFn: () => Promise<{ data: T | null; error: any }>,
  cacheDuration = 60000 // 1 minute default
): Promise<{ data: T | null; error: any }> => {
  const cacheKey = `supabase_cache_${key}`;
  const cached = sessionStorage.getItem(cacheKey);
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < cacheDuration) {
      return { data, error: null };
    }
  }
  
  const result = await queryFn();
  
  if (!result.error && result.data) {
    sessionStorage.setItem(cacheKey, JSON.stringify({
      data: result.data,
      timestamp: Date.now()
    }));
  }
  
  return result;
};
