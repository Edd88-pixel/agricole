import { createClient } from '@supabase/supabase-js';

const readEnv = (keys: string[]): string => {
  const env = import.meta.env as Record<string, string | undefined>;

  for (const key of keys) {
    const browserValue = env[key];
    if (browserValue) {
      return browserValue;
    }
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  }

  throw new Error(`Missing environment variable: ${keys[0]}`);
};

const supabaseUrl = readEnv(['VITE_SUPABASE_URL', 'REACT_APP_SUPABASE_URL']);
const supabaseAnonKey = readEnv(['VITE_SUPABASE_ANON_KEY', 'REACT_APP_SUPABASE_ANON_KEY']);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true
  }
});

export type SupabaseClient = typeof supabase;
