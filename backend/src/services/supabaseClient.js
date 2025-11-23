import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

let cachedClient;

const assertSupabaseConfig = () => {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error('Supabase configuration is missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
};

export const getSupabaseClient = () => {
  if (cachedClient) {
    return cachedClient;
  }

  assertSupabaseConfig();

  cachedClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      headers: {
        apikey: config.supabase.serviceRoleKey,
        Authorization: `Bearer ${config.supabase.serviceRoleKey}`
      }
    }
  });

  return cachedClient;
};
