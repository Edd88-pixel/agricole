import { createClient } from '@supabase/supabase-js';

const readEnv = (keys: string[]): string | undefined => {
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

  return undefined;
};

const supabaseUrl = readEnv(['VITE_SUPABASE_URL', 'REACT_APP_SUPABASE_URL']);
const supabaseAnonKey = readEnv(['VITE_SUPABASE_ANON_KEY', 'REACT_APP_SUPABASE_ANON_KEY']);

const createDisabledClient = () => {
  const notConfigured = (method: string) =>
    Promise.resolve({ data: null, error: { message: `Supabase not configured: ${method}` } });

  return {
    // Auth surface used by the app
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: (_: unknown, __: unknown) => ({
        data: { subscription: { unsubscribe: () => undefined } }
      }),
      signInWithPassword: (_: unknown) => notConfigured('auth.signInWithPassword'),
      signUp: (_: unknown) => notConfigured('auth.signUp'),
      signOut: () => notConfigured('auth.signOut')
    },
    // Database query builder
    from: () => ({
      select: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured: select' } }),
      insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured: insert' } }),
      upsert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured: upsert' } }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured: update' } })
      }),
      order: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured: order' } }),
      single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured: single' } })
    }),
    // Storage
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured: storage.upload' } })
      })
    },
    // Edge functions
    functions: {
      invoke: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured: functions.invoke' } })
    }
  } as any;
};

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: true, detectSessionInUrl: true }
      })
    : createDisabledClient();

export type SupabaseClient = typeof supabase;
