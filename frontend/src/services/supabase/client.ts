import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { appConfig } from '@/services/config';

let cachedClient: SupabaseClient | null = null;
let configurationWarningEmitted = false;

const getSupabaseConfig = () => {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '';
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '';
  return { url, anonKey };
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (cachedClient) return cachedClient;

  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    if (!configurationWarningEmitted) {
      // eslint-disable-next-line no-console
      console.warn(
        'Supabase Realtime is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable chat streaming.'
      );
      configurationWarningEmitted = true;
    }
    return null;
  }

  cachedClient = createClient(url, anonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        'x-client-info': 'agricole-knowledge-chat'
      }
    }
  });

  return cachedClient;
};

export const getSupabaseUrl = () => getSupabaseConfig().url || appConfig.apiBaseUrl;
