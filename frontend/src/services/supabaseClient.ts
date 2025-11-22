import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export const setSupabaseClient = (override: SupabaseClient | null) => {
  client = override;
};

export const getSupabaseClient = (): SupabaseClient => {
  if (client) return client;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase credentials are missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });

  return client;
};
